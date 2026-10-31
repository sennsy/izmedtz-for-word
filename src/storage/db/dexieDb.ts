import Dexie, { type Table } from 'dexie';
import JSZip from 'jszip';
import {
  IzmArchiveManifest,
  IzmAsset,
  IzmProject,
  IzmRecoverySnapshot,
} from '../../core/document/types';

export class IzmDatabase extends Dexie {
  projects!: Table<IzmProject, string>;
  assets!: Table<IzmAsset, string>;
  recoverySnapshots!: Table<IzmRecoverySnapshot, string>;

  constructor() {
    super('izmedtzz_local_db');
    this.version(1).stores({
      projects: 'id, title, category, updatedAt, createdAt',
      assets: 'id, name, mimeType, createdAt',
      recoverySnapshots: 'projectId, timestamp',
    });
  }
}

export const db = new IzmDatabase();

export async function saveProjectToDb(project: IzmProject): Promise<void> {
  const updated: IzmProject = {
    ...project,
    updatedAt: Date.now(),
  };
  await db.projects.put(updated);
  // Clear crash recovery snapshot once cleanly committed
  await db.recoverySnapshots.delete(project.id);
}

export async function writeRecoverySnapshot(project: IzmProject): Promise<void> {
  await db.recoverySnapshots.put({
    projectId: project.id,
    projectTitle: project.title,
    timestamp: Date.now(),
    projectData: project,
  });
}

export async function getRecoverySnapshots(): Promise<IzmRecoverySnapshot[]> {
  return db.recoverySnapshots.orderBy('timestamp').reverse().toArray();
}

export async function discardRecoverySnapshot(projectId: string): Promise<void> {
  await db.recoverySnapshots.delete(projectId);
}

export async function listProjectsFromDb(): Promise<IzmProject[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function deleteProjectFromDb(projectId: string): Promise<void> {
  await db.projects.delete(projectId);
  await db.recoverySnapshots.delete(projectId);
}

export async function saveAssetToDb(asset: IzmAsset): Promise<void> {
  await db.assets.put(asset);
}

export async function getAssetFromDb(assetId: string): Promise<IzmAsset | undefined> {
  return db.assets.get(assetId);
}

export async function listAssetsFromDb(): Promise<IzmAsset[]> {
  return db.assets.toArray();
}

export async function cleanUnusedAssets(): Promise<number> {
  const projects = await db.projects.toArray();
  const usedIds = new Set<string>();

  for (const p of projects) {
    p.assetIds?.forEach((id) => usedIds.add(id));
    for (const page of p.pages) {
      for (const obj of page.freeformObjects) {
        if (obj.assetId) usedIds.add(obj.assetId);
      }
    }
  }

  const allAssets = await db.assets.toArray();
  const unusedIds = allAssets.filter((a) => !usedIds.has(a.id)).map((a) => a.id);

  if (unusedIds.length > 0) {
    await db.assets.bulkDelete(unusedIds);
  }
  return unusedIds.length;
}

export interface StorageStats {
  projectCount: number;
  assetCount: number;
  usedBytes: number;
  quotaBytes: number;
}

export async function getStorageStats(): Promise<StorageStats> {
  const [projects, assets] = await Promise.all([db.projects.toArray(), db.assets.toArray()]);
  let calculatedBytes = 0;

  for (const p of projects) {
    calculatedBytes += new Blob([JSON.stringify(p)]).size;
  }
  for (const a of assets) {
    calculatedBytes += a.sizeBytes || new Blob([a.dataUrl]).size;
  }

  let quotaBytes = 1024 * 1024 * 500; // 500MB fallback
  let usedBytes = calculatedBytes;

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) quotaBytes = estimate.quota;
      if (estimate.usage && estimate.usage > calculatedBytes) {
        usedBytes = estimate.usage;
      }
    } catch {
      // Fallback to calculatedBytes
    }
  }

  return {
    projectCount: projects.length,
    assetCount: assets.length,
    usedBytes,
    quotaBytes,
  };
}

/**
 * Packages a project and its referenced assets into a canonical `.izm` archive Blob.
 */
export async function packProjectToIzmBlob(project: IzmProject): Promise<Blob> {
  const zip = new JSZip();

  // Gather referenced assets
  const assetIds = new Set<string>(project.assetIds || []);
  for (const page of project.pages) {
    for (const obj of page.freeformObjects) {
      if (obj.assetId) assetIds.add(obj.assetId);
    }
  }

  const assets: IzmAsset[] = [];
  for (const id of assetIds) {
    const asset = await db.assets.get(id);
    if (asset) assets.push(asset);
  }

  const manifest: IzmArchiveManifest = {
    format: 'izm-archive',
    extension: '.izm',
    version: '1.0.0',
    app: 'izmedtzz',
    exportedAt: new Date().toISOString(),
    projectId: project.id,
    title: project.title,
    pageCount: project.pages.length,
    assetCount: assets.length,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('document.json', JSON.stringify(project, null, 2));
  zip.file(
    'metadata.json',
    JSON.stringify(
      {
        title: project.title,
        category: project.category,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        pageSizePreset: project.pageSizePreset,
        orientation: project.orientation,
        dimensionsMm: project.dimensionsMm,
        customField: project.customField,
      },
      null,
      2
    )
  );

  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const asset of assets) {
      assetsFolder.file(`${asset.id}.json`, JSON.stringify(asset));
    }
  }

  const thumbnailsFolder = zip.folder('thumbnails');
  if (thumbnailsFolder) {
    project.pages.forEach((p, idx) => {
      if (p.thumbnailDataUrl) {
        thumbnailsFolder.file(`page_${idx + 1}.txt`, p.thumbnailDataUrl);
      }
    });
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Unpacks a `.izm` (or `.gabung`) archive file, restores its assets into IndexedDB, and returns the project.
 */
export async function unpackIzmFile(file: File): Promise<IzmProject> {
  const zip = await JSZip.loadAsync(file);
  const docFile = zip.file('document.json');
  if (!docFile) {
    throw new Error('Corrupt or unsupported archive: missing document.json inside .izm package.');
  }

  const rawJson = await docFile.async('string');
  let project: IzmProject;
  try {
    project = JSON.parse(rawJson) as IzmProject;
  } catch {
    throw new Error('Invalid JSON structure inside document.json.');
  }

  if (!project.id || !Array.isArray(project.pages)) {
    throw new Error('Project file is missing required document pages or schema fields.');
  }

  // Restore embedded assets if present
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    const assetFiles: JSZip.JSZipObject[] = [];
    assetsFolder.forEach((_, entry) => {
      if (!entry.dir && entry.name.endsWith('.json')) {
        assetFiles.push(entry);
      }
    });

    for (const entry of assetFiles) {
      try {
        const content = await entry.async('string');
        const asset = JSON.parse(content) as IzmAsset;
        if (asset && asset.id && asset.dataUrl) {
          await db.assets.put(asset);
        }
      } catch {
        // Ignore non-fatal asset parse issue
      }
    }
  }

  project.updatedAt = Date.now();
  await db.projects.put(project);
  return project;
}

/**
 * Creates a full backup archive containing all local projects and assets.
 */
export async function exportFullBackupBlob(): Promise<Blob> {
  const zip = new JSZip();
  const [projects, assets] = await Promise.all([db.projects.toArray(), db.assets.toArray()]);

  zip.file(
    'backup-manifest.json',
    JSON.stringify(
      {
        app: 'izmedtzz',
        type: 'full-vault-backup',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        projectCount: projects.length,
        assetCount: assets.length,
      },
      null,
      2
    )
  );
  zip.file('projects.json', JSON.stringify(projects, null, 2));
  zip.file('assets.json', JSON.stringify(assets, null, 2));

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Restores a full backup archive or single `.izm` archive.
 */
export async function restoreBackupFile(file: File): Promise<{ projectsRestored: number; assetsRestored: number }> {
  const zip = await JSZip.loadAsync(file);

  const projectsFile = zip.file('projects.json');
  if (projectsFile) {
    const projects = JSON.parse(await projectsFile.async('string')) as IzmProject[];
    const assetsFile = zip.file('assets.json');
    const assets = assetsFile ? (JSON.parse(await assetsFile.async('string')) as IzmAsset[]) : [];

    if (Array.isArray(assets) && assets.length > 0) {
      await db.assets.bulkPut(assets);
    }
    if (Array.isArray(projects) && projects.length > 0) {
      await db.projects.bulkPut(projects);
    }
    return { projectsRestored: projects.length, assetsRestored: assets.length };
  }

  // Fallback: user selected a single .izm project file in Restore
  const singleProject = await unpackIzmFile(file);
  return { projectsRestored: singleProject ? 1 : 0, assetsRestored: 0 };
}
