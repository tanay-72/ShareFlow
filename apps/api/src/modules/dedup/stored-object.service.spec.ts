import { StoredObjectRepository } from './stored-object.repository';
import { StoredObjectService } from './stored-object.service';
import { StorageProvider } from '../storage/storage-provider.interface';

function buildStoredObject(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'object-1',
    sha256: 'deadbeef',
    size: 1024,
    mimeType: 'application/octet-stream',
    storageKey: 'de/ad/deadbeef',
    refCount: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('StoredObjectService', () => {
  let repository: jest.Mocked<StoredObjectRepository>;
  let storage: jest.Mocked<StorageProvider>;
  let service: StoredObjectService;

  beforeEach(() => {
    repository = {
      findBySha256: jest.fn(),
      create: jest.fn(),
      incrementRefCount: jest.fn(),
      decrementRefCount: jest.fn(),
      delete: jest.fn(),
      findOrphaned: jest.fn(),
    } as unknown as jest.Mocked<StoredObjectRepository>;

    storage = {
      save: jest.fn(),
      createReadStream: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getSize: jest.fn(),
    };

    service = new StoredObjectService(repository, storage);
  });

  it('decrementing refCount to 0 deletes both the storage object and the DB row', async () => {
    repository.decrementRefCount.mockResolvedValue(buildStoredObject({ refCount: 0 }));

    await service.decrementRefCount('object-1');

    expect(storage.delete).toHaveBeenCalledWith('de/ad/deadbeef');
    expect(repository.delete).toHaveBeenCalledWith('object-1');
  });

  it('decrementing refCount above 0 leaves storage untouched', async () => {
    repository.decrementRefCount.mockResolvedValue(buildStoredObject({ refCount: 1 }));

    await service.decrementRefCount('object-1');

    expect(storage.delete).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('sweepOrphans deletes every orphaned object it finds', async () => {
    repository.findOrphaned.mockResolvedValue([
      buildStoredObject({ id: 'orphan-1', storageKey: 'aa/bb/orphan1', refCount: 0 }),
      buildStoredObject({ id: 'orphan-2', storageKey: 'cc/dd/orphan2', refCount: 0 }),
    ]);

    const count = await service.sweepOrphans();

    expect(count).toBe(2);
    expect(storage.delete).toHaveBeenCalledWith('aa/bb/orphan1');
    expect(storage.delete).toHaveBeenCalledWith('cc/dd/orphan2');
    expect(repository.delete).toHaveBeenCalledTimes(2);
  });

  it('sweepOrphans is a no-op when nothing is orphaned', async () => {
    repository.findOrphaned.mockResolvedValue([]);
    await expect(service.sweepOrphans()).resolves.toBe(0);
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
