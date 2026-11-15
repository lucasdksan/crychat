export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatShortDateTime(iso: string | null): string {
  if (!iso) return 'Nunca sincronizado';
  const date = new Date(iso);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Falha ao ler imagem.'));
        return;
      }
      resolve({
        base64: result.slice(commaIndex + 1),
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => reject(new Error('Erro ao carregar arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
