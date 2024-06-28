// src/types/formidable/VolatileFile.d.ts

declare module 'formidable/VolatileFile' {
  class VolatileFileExt extends EventEmitter {
    constructor(properties: File);
    open(): void;
    toJSON(): FileJSON;
    toString(): string;
    write(buffer: string, cb: () => void): void;
    end(cb: () => void): void;
    destroy(): void;

    // missing fields (see https://github.com/node-formidable/formidable?tab=readme-ov-file#file)
    size: number
    filepath: string
    originalFilename: string
    newFilename: string
    mimetype: string
    mtime: Date | null
    hashAlgorithm: false | 'sha1' | 'md5' | 'sha256'
    hash: string | object | null

    // extenstion to hold s3 location after upload
    location?: string
  }
  
  export default VolatileFile
}
