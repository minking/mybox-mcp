# mybox-mcp (Unofficial)

네이버 클라우드 MYBOX Open API를 위한 공식 비공식 MCP(Model Context Protocol) 서버입니다.

제공되는 모든 API는 네이버 MYBOX Open API 스펙을 기반으로 작성되었으며, 파일 및 폴더 조회, 업로드/다운로드, 복사/이동, 휴지통 관리 등 홈페이지에 명시된 20개 전체 API 기능을 100% 지원합니다.

> 참고: 본 프로젝트는 네이버 클라우드 공식 프로젝트가 아니며, 개인 액세스 토큰 유출 시 발생하는 책임은 사용자에게 있습니다.

---

## 지원 API 목록

| 도구 (Tool) | 설명 | 파라미터 (주요 필드) |
|---|---|---|
| `dms_storage` | 내 파일 속성(용량, 갯수 등) 조회 | - |
| `dms_root` | 루트 파일/폴더 목록 조회 | `sort`, `order`, `offset`, `limit` |
| `dms_list` | 특정 폴더 내 파일/폴더 목록 조회 | `resourceId`, `sort`, `order` 등 |
| `dms_resourceId` | 개별 파일/폴더 속성 조회 | `resourceId` |
| `files_create_folder` | 폴더 생성 | `folderName`, `parentId` |
| `files_upload` | 파일 업로드 URL 생성 | `fileName`, `fileSize`, `isOverwrite`, `resume` 등 |
| `files_download` | 파일 다운로드 URL 생성 | `resourceId` |
| `files_copy` | 파일/폴더 복사 | `resourceId`, `parentId`, `name`, `isOverwrite` |
| `files_delete` | 파일/폴더 삭제 | `resourceIds` (배열) |
| `files_move` | 파일/폴더 이동 | `resourceId`, `parentId`, `isOverwrite` |
| `files_rename` | 파일/폴더 이름 변경 | `resourceId`, `name` |
| `dms_favorite` | 파일/폴더 즐겨찾기 추가 | `resourceId` |
| `dms_unfavorite` | 파일/폴더 즐겨찾기 해제 | `resourceId` |
| `search_files_resources` | 파일 검색 | `query`, `type`, `sort`, `order` 등 |
| `search_folders_resources` | 폴더 검색 | `query`, `sort`, `order` 등 |
| `dms_trash_list` | 휴지통 파일/폴더 목록 조회 | `sort`, `order` 등 |
| `files_trash_restore` | 휴지통 파일/폴더 복원 | `resourceId`, `isOverwrite` |
| `files_trash_clean_resourceId`| 휴지통 개별 영구 삭제 | `resourceId` |
| `files_trash_clean` | 휴지통 전체 비우기 | - |
| `dms_trash_routine` | 휴지통 자동 삭제 주기 설정 | `trashAutoDeleteDays` |

---

## 주요 특징 및 정책

- **완벽한 파라미터 매핑**: MYBOX API에서 요구하는 필수 및 선택 파라미터, 바디 값 등을 모두 `zod` 스키마로 완벽하게 규격화했습니다.
- **표준 HTTP 통신**: `axios`를 활용하여 빠르고 안정적인 API 통신을 수행합니다.
- **Node 호환성**: Node.js 20, 22, 24 환경을 완벽하게 지원합니다.
- **보안 유의**: `MYBOX_ACCESS_TOKEN` 개인 액세스 토큰은 절대 외부에 노출되지 않도록 주의하세요.

---

## 설정 방법

사용하시는 클라이언트(Cursor, Claude Desktop 등)의 `mcp_config.json` 설정에 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "mybox-mcp": {
      "command": "npx",
      "args": ["-y", "github:minking/mybox-mcp"],
      "env": {
        "MYBOX_ACCESS_TOKEN": "발급받은_MYBOX_개인액세스토큰"
      }
    }
  }
}
```

---

## 라이선스

[MIT License](LICENSE) (c) 2026 minking
