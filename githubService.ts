
import { AppData } from "./types";

/**
 * Converte string para Base64 de forma segura para UTF-8 e strings longas
 */
const toBase64 = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Serviço para sincronizar o estado da aplicação com um repositório GitHub.
 * Implementa cache-busting para evitar conflitos de SHA.
 */
export const syncDataToGithub = async (data: AppData): Promise<{ success: boolean; message: string }> => {
  const config = data.githubConfig;

  if (!config || !config.token || !config.repo) {
    return { success: false, message: "Configuração do GitHub ausente." };
  }

  const repoPath = config.repo.trim();
  if (!repoPath.includes('/')) {
    return { success: false, message: "Formato inválido (user/repo)." };
  }

  // Sanitização: Remove dados de sessão voláteis e protege senhas
  const backupData = {
    ...data,
    currentUser: null,
    users: data.users.map(u => ({ ...u, password: u.password ? 'HIDDEN' : '' }))
  };

  const fileName = 'backup_smartgestao.json';
  // Cache-busting na URL de consulta para garantir o SHA atualizado
  const repoUrl = `https://api.github.com/repos/${repoPath}/contents/${fileName}?t=${Date.now()}`;
  
  try {
    const jsonString = JSON.stringify(backupData, null, 2);
    const contentBase64 = toBase64(jsonString);

    // 1. Obter SHA atual do arquivo (se existir)
    const getRes = await fetch(repoUrl, {
      cache: 'no-store',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha: string | undefined;
    if (getRes.status === 200) {
      const fileInfo = await getRes.json();
      sha = fileInfo.sha;
    } else if (getRes.status === 401) {
      return { success: false, message: "Token inválido (Unauthorized)." };
    } else if (getRes.status === 404 && getRes.statusText !== 'Not Found') {
       // Se o erro 404 for do repositório e não do arquivo
       return { success: false, message: "Repositório não encontrado." };
    }

    // 2. Enviar arquivo para o GitHub
    const putRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `🤖 SmartGestão Auto-Backup: ${new Date().toLocaleString('pt-BR')}`,
        content: contentBase64,
        sha: sha
      })
    });

    if (putRes.ok) {
      return { success: true, message: "Backup sincronizado no GitHub!" };
    } else {
      const result = await putRes.json();
      return { success: false, message: `GitHub API: ${result.message}` };
    }
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return { success: false, message: "Erro de conexão com GitHub." };
  }
};
