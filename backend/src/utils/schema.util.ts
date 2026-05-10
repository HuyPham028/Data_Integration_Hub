import * as crypto from 'crypto';

export function generateSchemaHash(details: any[]): string {
  if (!details || !Array.isArray(details) || details.length === 0) {
    return crypto.createHash('sha256').update('empty').digest('hex');
  }

  // 1. Chuẩn hóa và Format từng trường
  const normalizedFields = details.map((field) => {
    const name = (field.name || '').toLowerCase().trim();
    const type = (field.type || '').toLowerCase().trim();
    // Xử lý length, nếu null thì quy về chuỗi 'null'
    const length = field.length === null || field.length === undefined ? 'null' : String(field.length);
    
    return `${name}:${type}:${length}`;
  });

  normalizedFields.sort();

  const hashString = normalizedFields.join('|'); 
  // Ví dụ chuỗi sinh ra: "chuyende:string:null|dot_sinh_hoat:string:null|kq_tham_gia:string:null..."

  return crypto.createHash('sha256').update(hashString).digest('hex');
}