#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';

const server = new McpServer({ name: 'mybox-mcp', version: '1.0.0' });
const BASE_URL = 'https://open-api.mybox.naver.com/v1/drive';

function getAuthHeaders() {
  const token = process.env.MYBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MYBOX_ACCESS_TOKEN environment variable is not set. Please set your Personal Access Token.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function makeRequest(method: string, endpoint: string, data?: any, params?: any) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await axios({
      method,
      url,
      headers: getAuthHeaders(),
      data,
      params
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// 1. dms_storage: 내 파일 속성 조회
server.tool('dms_storage', '내 파일 속성 조회', {}, async () => {
  const result = await makeRequest('GET', '/storage');
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 2. dms_root: 루트 파일/폴더 목록 조회
server.tool('dms_root', '루트 파일/폴더 목록 조회', {
  sort: z.string().optional().describe('정렬 기준 (예: name, modifiedTime, size)'),
  order: z.enum(['asc', 'desc']).optional().describe('정렬 방향'),
  offset: z.number().optional().describe('페이지 오프셋'),
  limit: z.number().optional().describe('한 번에 가져올 최대 개수')
}, async (args) => {
  const result = await makeRequest('GET', '/files', undefined, args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 3. dms_list: 특정 폴더 내 파일/폴더 목록 조회
server.tool('dms_list', '특정 폴더 내 파일/폴더 목록 조회', {
  resourceId: z.string().describe('조회할 폴더의 ID'),
  sort: z.string().optional().describe('정렬 기준'),
  order: z.enum(['asc', 'desc']).optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
}, async (args) => {
  const { resourceId, ...params } = args;
  const result = await makeRequest('GET', `/files/${resourceId}/children`, undefined, params);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 4. dms_resourceId: 개별 파일/폴더 속성 조회
server.tool('dms_resourceId', '개별 파일/폴더 속성 조회', {
  resourceId: z.string().describe('조회할 파일/폴더의 ID')
}, async (args) => {
  const result = await makeRequest('GET', `/files/${args.resourceId}`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 5. files_create_folder: 폴더 생성
server.tool('files_create_folder', '폴더 생성', {
  folderName: z.string().describe('생성할 폴더 이름'),
  parentId: z.string().optional().describe('폴더가 생성될 위치의 상위 폴더 ID(생략 시 루트)')
}, async (args) => {
  const result = await makeRequest('POST', '/folders', args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 6. files_upload: 파일 업로드 URL 생성
server.tool('files_upload', '파일 업로드 URL 생성', {
  fileName: z.string().describe('업로드 할 파일 이름 (확장자 포함)'),
  fileSize: z.number().describe('업로드할 파일 크기(byte)'),
  isOverwrite: z.boolean().optional().describe('동일 이름 존재 시 덮어쓰기 여부'),
  modifiedTime: z.string().optional().describe('파일 수정일시'),
  parentId: z.string().optional().describe('파일을 업로드할 폴더 ID(생략 시 루트)'),
  resume: z.boolean().optional().describe('이어올리기 여부'),
  offset: z.number().optional().describe('이어올리기 시작점')
}, async (args) => {
  const result = await makeRequest('POST', '/files/upload-url', args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 7. files_download: 파일 다운로드 URL 생성
server.tool('files_download', '파일 다운로드 URL 생성', {
  resourceId: z.string().describe('다운로드할 파일의 ID')
}, async (args) => {
  const result = await makeRequest('GET', `/files/${args.resourceId}/download-url`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 8. files_copy: 파일/폴더 복사
server.tool('files_copy', '파일/폴더 복사', {
  resourceId: z.string().describe('원본 파일/폴더 ID'),
  parentId: z.string().optional().describe('복사본을 저장할 폴더 ID(생략 시 루트)'),
  name: z.string().optional().describe('복사본 이름(생략 시 원본 이름 유지)'),
  isOverwrite: z.boolean().optional().describe('동일 이름 존재 시 덮어쓰기 여부')
}, async (args) => {
  const { resourceId, ...body } = args;
  const result = await makeRequest('POST', `/files/${resourceId}/copy`, body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 9. files_delete: 파일/폴더 삭제
server.tool('files_delete', '파일/폴더 삭제', {
  resourceIds: z.array(z.string()).describe('삭제할 파일/폴더 ID 목록 (콤마 또는 배열로 처리 가능)')
}, async (args) => {
  // Assuming the API takes an array or comma-separated list
  const resourceIdsStr = args.resourceIds.join(',');
  const result = await makeRequest('DELETE', `/files`, undefined, { resourceIds: resourceIdsStr });
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 10. files_move: 파일/폴더 이동
server.tool('files_move', '파일/폴더 이동', {
  resourceId: z.string().describe('이동할 파일/폴더 ID'),
  parentId: z.string().describe('이동할 위치의 상위 폴더 ID'),
  isOverwrite: z.boolean().optional().describe('동일 이름 존재 시 덮어쓰기 여부')
}, async (args) => {
  const { resourceId, ...body } = args;
  const result = await makeRequest('POST', `/files/${resourceId}/move`, body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 11. files_rename: 파일/폴더 이름 변경
server.tool('files_rename', '파일/폴더 이름 변경', {
  resourceId: z.string().describe('이름을 변경할 파일/폴더 ID'),
  name: z.string().describe('새로운 이름 (확장자 포함)')
}, async (args) => {
  const { resourceId, ...body } = args;
  const result = await makeRequest('POST', `/files/${resourceId}/rename`, body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 12. dms_favorite: 즐겨찾기 표시
server.tool('dms_favorite', '즐겨찾기 표시', {
  resourceId: z.string().describe('즐겨찾기 추가할 파일/폴더 ID')
}, async (args) => {
  const result = await makeRequest('POST', `/files/${args.resourceId}/favorite`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 13. dms_unfavorite: 즐겨찾기 해제
server.tool('dms_unfavorite', '즐겨찾기 해제', {
  resourceId: z.string().describe('즐겨찾기 해제할 파일/폴더 ID')
}, async (args) => {
  const result = await makeRequest('DELETE', `/files/${args.resourceId}/favorite`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 14. search_files_resources: 파일 검색
server.tool('search_files_resources', '파일 검색', {
  query: z.string().describe('검색어'),
  type: z.string().optional().describe('파일 타입 필터'),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
}, async (args) => {
  const result = await makeRequest('GET', `/search/files`, undefined, args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 15. search_folders_resources: 폴더 검색
server.tool('search_folders_resources', '폴더 검색', {
  query: z.string().describe('검색어'),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
}, async (args) => {
  const result = await makeRequest('GET', `/search/folders`, undefined, args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 16. dms_trash_list: 휴지통 목록 조회
server.tool('dms_trash_list', '휴지통 목록 조회', {
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  offset: z.number().optional(),
  limit: z.number().optional()
}, async (args) => {
  const result = await makeRequest('GET', `/trash`, undefined, args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 17. files_trash_restore: 휴지통 복원
server.tool('files_trash_restore', '휴지통 복원', {
  resourceId: z.string().describe('복원할 리소스 ID'),
  isOverwrite: z.boolean().optional().describe('동일 이름 존재 시 덮어쓰기 여부')
}, async (args) => {
  const { resourceId, ...body } = args;
  const result = await makeRequest('POST', `/trash/${resourceId}/restore`, body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 18. files_trash_clean_resourceId: 휴지통 특정 파일 삭제 (영구삭제)
server.tool('files_trash_clean_resourceId', '휴지통 특정 파일 삭제 (영구삭제)', {
  resourceId: z.string().describe('영구 삭제할 리소스 ID')
}, async (args) => {
  const result = await makeRequest('DELETE', `/trash/${args.resourceId}`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 19. files_trash_clean: 휴지통 전체 삭제
server.tool('files_trash_clean', '휴지통 전체 삭제', {}, async () => {
  const result = await makeRequest('DELETE', `/trash`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// 20. dms_trash_routine: 휴지통 자동 삭제 주기 설정
server.tool('dms_trash_routine', '휴지통 자동 삭제 주기 설정', {
  trashAutoDeleteDays: z.number().describe('휴지통 자동 삭제 주기 (0, 5, 15, 30, 50 중 하나)')
}, async (args) => {
  const result = await makeRequest('PUT', `/trash/auto-delete`, args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// Start the stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MYBOX MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
