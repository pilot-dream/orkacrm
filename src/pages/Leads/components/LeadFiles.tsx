import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseActive } from '../../../shared/api/supabaseClient';
import { Paperclip, Trash2, Download, Eye, FileText, Loader2 } from 'lucide-react';

interface LeadFilesProps {
  leadId: string;
  onFilesChanged?: () => void;
}

interface DBFile {
  id: string;
  nome: string;
  url: string;
  tamanho: number;
  created_at: string;
}

export const LeadFiles: React.FC<LeadFilesProps> = ({ leadId, onFilesChanged }) => {
  const [files, setFiles] = useState<DBFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedExtensions = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'zip'];

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseActive()) {
        const { data, error: dbError } = await supabase
          .from('arquivos')
          .select('*')
          .eq('relacionamento_id', leadId)
          .eq('relacionamento_tipo', 'lead')
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        setFiles(data || []);
      } else {
        const savedFiles = JSON.parse(localStorage.getItem('orka_files') || '[]');
        const filtered = savedFiles.filter((f: any) => f.relacionamento_id === leadId && f.relacionamento_tipo === 'lead');
        setFiles(filtered);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar arquivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [leadId]);

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setError(`Extensão inválida. Tipos permitidos: ${allowedExtensions.join(', ').toUpperCase()}`);
      return false;
    }
    // Limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('O tamanho máximo do arquivo deve ser 10MB.');
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;
    setUploading(true);
    setError(null);

    try {
      if (isSupabaseActive()) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `leads/${leadId}/${fileName}`;

        // Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('arquivos')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error('Falha ao subir arquivo para o Storage. Verifique se o bucket "arquivos" está criado no Supabase.');
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('arquivos')
          .getPublicUrl(filePath);

        // Save Metadata
        const { error: insertError } = await supabase
          .from('arquivos')
          .insert({
            relacionamento_tipo: 'lead',
            relacionamento_id: leadId,
            nome: file.name,
            url: publicUrl,
            tamanho: Math.round(file.size / 1024) // Size in KB
          });

        if (insertError) throw insertError;
      } else {
        // Mock offline upload
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const mockFile = {
            id: `file-${Date.now()}`,
            relacionamento_tipo: 'lead',
            relacionamento_id: leadId,
            nome: file.name,
            url: base64data.startsWith('data:image') ? base64data : '#mock-download',
            tamanho: Math.round(file.size / 1024),
            created_at: new Date().toISOString()
          };

          const savedFiles = JSON.parse(localStorage.getItem('orka_files') || '[]');
          savedFiles.push(mockFile);
          localStorage.setItem('orka_files', JSON.stringify(savedFiles));
          fetchFiles();
        };
        reader.readAsDataURL(file);
        return;
      }

      await fetchFiles();
      if (onFilesChanged) onFilesChanged();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao realizar upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDelete = async (file: DBFile) => {
    if (!confirm(`Deseja realmente excluir o arquivo "${file.nome}"?`)) return;
    setLoading(true);
    setError(null);

    try {
      if (isSupabaseActive()) {
        // Delete row
        const { error: dbError } = await supabase
          .from('arquivos')
          .delete()
          .eq('id', file.id);

        if (dbError) throw dbError;

        // Try deleting from Storage if URL is standard
        try {
          const urlParts = file.url.split('/storage/v1/object/public/arquivos/');
          if (urlParts.length > 1) {
            const storagePath = decodeURIComponent(urlParts[1]);
            await supabase.storage.from('arquivos').remove([storagePath]);
          }
        } catch (stErr) {
          console.warn('Erro ao remover arquivo do Storage (metadata deletado com sucesso):', stErr);
        }
      } else {
        const savedFiles = JSON.parse(localStorage.getItem('orka_files') || '[]');
        const updated = savedFiles.filter((f: any) => f.id !== file.id);
        localStorage.setItem('orka_files', JSON.stringify(updated));
      }

      await fetchFiles();
      if (onFilesChanged) onFilesChanged();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao excluir arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const isImage = (name: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg'].includes(ext || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Paperclip size={16} /> Arquivos Vinculados
      </h4>

      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {/* Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px dashed var(--color-primary)' : '2px dashed var(--border-color)',
          backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.04)' : 'rgba(255, 255, 255, 0.01)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <input 
          type="file" 
          id="lead-file-upload" 
          multiple={false} 
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="lead-file-upload" style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
              <span>Enviando arquivo...</span>
            </div>
          ) : (
            <>
              <Paperclip size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-muted)' }} />
              <span>Clique ou arraste arquivos para anexar</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tipos aceitos: PDF, DOCX, XLSX, PNG, JPG, ZIP (Máx: 10MB)
              </span>
            </>
          )}
        </label>
      </div>

      {/* Files List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : files.length > 0 ? (
          files.map((file) => (
            <div 
              key={file.id} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-card, #1E293B)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #334155)',
                fontSize: '0.82rem',
                transition: 'var(--transition-smooth)'
              }}
              className="table-row-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                {isImage(file.nome) && file.url !== '#mock-download' ? (
                  <img 
                    src={file.url} 
                    alt={file.nome} 
                    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <FileText size={18} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ color: '#fff', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={file.nome}>
                    {file.nome}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {file.tamanho} KB • {new Date(file.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {file.url !== '#mock-download' && (
                  <button 
                    onClick={() => window.open(file.url, '_blank')}
                    className="icon-btn" 
                    title="Visualizar / Abrir"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <Eye size={16} />
                  </button>
                )}
                {file.url !== '#mock-download' && (
                  <a 
                    href={file.url} 
                    download={file.nome}
                    target="_blank" 
                    rel="noreferrer"
                    className="icon-btn"
                    title="Baixar"
                    style={{ display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}
                  >
                    <Download size={16} />
                  </a>
                )}
                <button 
                  onClick={() => handleDelete(file)}
                  className="icon-btn" 
                  title="Excluir"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Nenhum arquivo anexado ainda.
          </div>
        )}
      </div>
    </div>
  );
};
