/**
 * ProjectStorage - 项目存储服务
 * 使用 IndexedDB 存储项目数据
 */

import type { ImageData, EffectTemplate, EffectConfig } from '@/types';

// 朋友圈设置数据结构
export interface MomentsSettings {
  avatar: string;
  coverImage: string;
  nickname: string;
  signature: string;
  content: string;
  timeText: string;
  location: string;
  likes: string;
}

// 项目数据结构（不含 File 对象，可序列化）
export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  images: SavedImageData[];
  templateId?: string;
  customSettings?: EffectConfig;
  momentsSettings?: MomentsSettings;
}

// 可序列化的图片数据
export interface SavedImageData {
  id: string;
  position: number;
  thumbnail: string;
  fullSize: string;
  width: number;
  height: number;
  contentType: string;
  metadata: {
    fileSize: number;
    format: string;
    uploadedAt: string;
  };
}

// 项目列表项
export interface ProjectListItem {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
}

const DB_NAME = 'wechat-grid-projects';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

class ProjectStorage {
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('无法打开数据库'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 将 ImageData 转换为可保存的格式
   */
  private imageToSaved(image: ImageData): SavedImageData {
    return {
      id: image.id,
      position: image.position,
      thumbnail: image.thumbnail,
      fullSize: image.fullSize,
      width: image.width,
      height: image.height,
      contentType: image.contentType,
      metadata: {
        fileSize: image.metadata.fileSize,
        format: image.metadata.format,
        uploadedAt: image.metadata.uploadedAt.toISOString(),
      },
    };
  }

  /**
   * 将保存的数据转换回 ImageData（不含 File）
   */
  savedToImage(saved: SavedImageData): Omit<ImageData, 'originalFile'> & { originalFile: null } {
    return {
      id: saved.id,
      position: saved.position,
      thumbnail: saved.thumbnail,
      fullSize: saved.fullSize,
      width: saved.width,
      height: saved.height,
      contentType: saved.contentType as ImageData['contentType'],
      metadata: {
        fileSize: saved.metadata.fileSize,
        format: saved.metadata.format,
        uploadedAt: new Date(saved.metadata.uploadedAt),
      },
      originalFile: null as unknown as File, // 恢复时无法还原 File 对象
    };
  }

  /**
   * 保存项目
   */
  async saveProject(
    name: string,
    images: ImageData[],
    template?: EffectTemplate,
    customSettings?: EffectConfig,
    existingId?: string,
    momentsSettings?: MomentsSettings
  ): Promise<string> {
    const db = await this.initDB();
    const id = existingId || this.generateId();
    const now = new Date().toISOString();

    const project: SavedProject = {
      id,
      name,
      createdAt: existingId ? (await this.getProject(existingId))?.createdAt || now : now,
      updatedAt: now,
      images: images.map(img => this.imageToSaved(img)),
      templateId: template?.id,
      customSettings,
      momentsSettings,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(project);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('保存项目失败'));
    });
  }

  /**
   * 获取项目
   */
  async getProject(id: string): Promise<SavedProject | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('读取项目失败'));
    });
  }

  /**
   * 获取项目列表
   */
  async getProjectList(): Promise<ProjectListItem[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // 按更新时间倒序

      const projects: ProjectListItem[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const project = cursor.value as SavedProject;
          projects.push({
            id: project.id,
            name: project.name,
            thumbnail: project.images[0]?.thumbnail || '',
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            imageCount: project.images.length,
          });
          cursor.continue();
        } else {
          resolve(projects);
        }
      };

      request.onerror = () => reject(new Error('获取项目列表失败'));
    });
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('删除项目失败'));
    });
  }

  /**
   * 清空所有项目
   */
  async clearAll(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('清空项目失败'));
    });
  }
}

export const projectStorage = new ProjectStorage();
