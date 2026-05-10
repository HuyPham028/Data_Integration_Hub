export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function inferDataTypeFromBatch(dataArray: any[], fieldName: string): string {
  for (const record of dataArray) {
    const value = record[fieldName];
    
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
        // Phân biệt int và float
        return Number.isInteger(value) ? 'int' : 'float';
    }
    
    if (typeof value === 'string') {
      // Kiểm tra xem chuỗi có phải là định dạng ISO Date không (VD: "2025-05-20T00:00:00.000Z")
      const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
      if (isDate) return 'datetime';
      
      // kiểm tra xem chuỗi có thực chất là số không (API trả về "123")
      // if (!isNaN(Number(value))) return 'int'; 

      return 'string';
    }
  }

  return 'string';
}