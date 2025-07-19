# POC Node MCP Server

**POC (Proof of Concept)** - MCP(Model Context Protocol) 서버 개발 학습 및 테스트를 위한 데모 프로젝트입니다.

다양한 계산 도구와 사용자 정보 리소스를 제공하는 MCP 서버로, MCP 서버 개발 방법을 학습하고 테스트할 수 있습니다.

## 🎯 프로젝트 목적

- MCP 서버 개발 방법 학습
- Tool과 Resource의 차이점 이해
- LLM과의 연동 테스트
- npm 패키지 배포 및 npx 실행 테스트

## 설치

```bash
npm install -g poc-node-mcp-server
```

또는 `npx`로 직접 실행:

```bash
npx poc-node-mcp-server
```

## 제공하는 기능

### Tools (도구)

#### 1. add - 수학 계산
두 숫자를 입력받아 그 합을 반환합니다.

```json
{
  "method": "tools/call",
  "params": {
    "name": "add",
    "arguments": {
      "a": 5,
      "b": 3
    }
  }
}
```

#### 2. get_weather - 날씨 정보 조회
도시 이름을 입력받아 해당 도시의 랜덤 날씨 정보를 반환합니다.

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "city": "서울"
    }
  }
}
```

### Resources (리소스)

#### 1. greeting - 인사말
사용자 이름을 받아 인사말을 생성합니다.

```
URI: greeting://홍길동
```

#### 2. user_profile - 사용자 프로필
사용자 이름을 받아 랜덤한 프로필 정보를 생성합니다.

```
URI: user_profile://김철수
```

## Gemini CLI 연동

`.gemini/settings.json` 파일에 다음 설정을 추가하세요:

```json
{
  "mcpServers": {
    "demo-mcp-server": {
      "command": "npx",
      "args": ["poc-node-mcp-server"],
      "description": "POC MCP 서버 - 학습 및 테스트용 다양한 계산 도구와 사용자 정보 리소스 제공"
    }
  }
}
```

## 사용 예시

### LLM과의 대화

```
사용자: "5와 3을 더해줘"
LLM: add 도구를 사용하여 8을 반환

사용자: "서울의 날씨를 알려줘"
LLM: get_weather 도구를 사용하여 "서울의 현재 날씨: 맑음, 기온: 15°C, 습도: 65%" 반환

사용자: "홍길동에게 인사해줘"
LLM: greeting://홍길동 리소스에 접근하여 "안녕하세요, 홍길동님!" 반환

사용자: "김철수의 프로필을 보여줘"
LLM: user_profile://김철수 리소스에 접근하여 랜덤 프로필 정보 반환
```

## 개발

### 로컬 개발 환경 설정

```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 개발 모드 실행
npm run dev

# 테스트 실행
npm test
```

### 프로젝트 구조

```
poc-node-mcp-server/
├── src/
│   └── index.ts          # 메인 MCP 서버 코드
├── dist/
│   └── index.js          # 빌드된 JavaScript 파일
├── test-mcp.js           # MCP 서버 테스트 스크립트
├── package.json          # 프로젝트 설정
├── tsconfig.json         # TypeScript 설정
├── MCP_Learning_Guide.md # MCP 학습 가이드
└── README.md            # 프로젝트 문서
```

## 📚 학습 자료

이 프로젝트는 MCP 서버 개발을 위한 학습 자료입니다. `MCP_Learning_Guide.md` 파일에서 다음 내용을 학습할 수 있습니다:

- MCP 서버 기본 개념
- Tool vs Resource 차이점
- LLM 활용을 위한 최적화 방법
- Transport 방식 이해
- 실제 구현 예제
- Gemini CLI 연동 방법

## ⚠️ 주의사항

- 이 프로젝트는 **학습 및 테스트 목적**으로 제작되었습니다.
- 실제 프로덕션 환경에서 사용하기에는 부족한 부분이 있을 수 있습니다.
- 랜덤 데이터를 사용하므로 실제 데이터와 다를 수 있습니다.

## 라이선스

ISC

## 기여하기

1. 이 저장소를 포크하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 관련 링크

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [Gemini CLI 문서](https://ai.google.dev/docs/gemini_cli) 