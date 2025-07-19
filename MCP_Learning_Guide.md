# MCP (Model Context Protocol) 서버 학습 가이드

## 목차
1. [MCP 서버 기본 개념](#mcp-서버-기본-개념)
2. [Tool vs Resource 차이점](#tool-vs-resource-차이점)
3. [LLM 활용을 위한 최적화](#llm-활용을-위한-최적화)
4. [Transport 방식 이해](#transport-방식-이해)
5. [실제 구현 예제](#실제-구현-예제)
6. [Gemini CLI 연동](#gemini-cli-연동)

---

## MCP 서버 기본 개념

### MCP란?
Model Context Protocol은 LLM(Large Language Model)이 외부 도구와 리소스에 접근할 수 있도록 하는 표준 프로토콜입니다.

### 주요 구성 요소
- **Tool**: LLM이 특정 작업을 수행할 수 있는 함수
- **Resource**: LLM이 데이터에 접근할 수 있는 URI 기반 리소스
- **Transport**: 서버와 클라이언트 간의 통신 방식

---

## Tool vs Resource 차이점

### Tool (도구)

#### 언제 LLM이 사용하는가?
- **작업 수행이 필요할 때**: 계산, 파일 처리, API 호출 등
- **사용자 요청이 "~해줘" 형태일 때**: "5와 3을 더해줘", "파일을 업로드해줘"
- **상태 변경이 필요할 때**: 데이터베이스 수정, 설정 변경 등

#### LLM 사용 패턴
```
사용자: "5와 3을 더해줘"
LLM: add 도구 호출 → 결과 반환
```

#### 특징
- **액션 기반**: 클라이언트가 "이 작업을 수행해달라"고 요청
- **파라미터 입력**: 함수처럼 매개변수를 받아서 처리
- **결과 반환**: 작업 수행 후 결과를 즉시 반환
- **상태 변경 가능**: 서버의 상태를 변경하거나 외부 API 호출 가능

#### 사용 예시
- 계산기 기능 (add, multiply 등)
- 파일 처리 (upload, download 등)
- 데이터베이스 쿼리
- 외부 API 호출

### Resource (리소스)

#### 언제 LLM이 사용하는가?
- **정보 조회가 필요할 때**: 문서 읽기, 프로필 확인 등
- **사용자 요청이 "~보여줘" 형태일 때**: "홍길동의 프로필 보여줘", "문서 내용 알려줘"
- **참조 데이터가 필요할 때**: 설정값, 정적 정보 등

#### LLM 사용 패턴
```
사용자: "홍길동에게 인사해줘"
LLM: greeting://홍길동 리소스 접근 → 인사말 생성
```

#### 특징
- **데이터 접근**: 특정 URI로 식별되는 데이터에 접근
- **URI 기반**: `greeting://{name}` 같은 형태의 URI 패턴을 사용합니다.  
  - **이유**: LLM이 다양한 데이터를 일관된 방식으로 접근할 수 있도록, 각 리소스를 고유하게 식별하는 URI 체계를 사용합니다.  
  - 예를 들어, `greeting://홍길동`처럼 이름만 바꿔서 여러 사람의 인사말 리소스를 쉽게 만들고 조회할 수 있습니다.  
  - URI 기반 설계는 웹의 REST API처럼 리소스 중심의 접근 방식을 따르기 때문에, LLM이 "어떤 데이터에 접근해야 하는지"를 명확하게 지정할 수 있고, 확장성도 높아집니다.
- **콘텐츠 반환**: 해당 리소스의 내용을 반환
- **읽기 전용**: 주로 데이터를 조회하는 용도

#### 사용 예시
- 문서나 파일 내용
- 사용자 프로필 정보
- 설정 데이터
- 정적 콘텐츠

### 비교표

| 구분 | Tool | Resource |
|------|------|----------|
| **목적** | 작업 수행 | 데이터 접근 |
| **호출 방식** | 함수 호출 | URI 접근 |
| **반환값** | 작업 결과 | 콘텐츠/데이터 |
| **상태 변경** | 가능 | 일반적으로 불가 |
| **예시** | `add(5, 3)` | `greeting://홍길동` |

### Tool 등록 방식 비교

#### 1. 기본 `tool()` 방식
```typescript
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);
```

**특징:**
- 간단하고 빠른 등록
- 최소한의 메타데이터
- LLM이 이름과 매개변수로 용도 추론

#### 2. 상세 `registerTool()` 방식
```typescript
server.registerTool(
  "get_weather",
  {
    title: "날씨 조회",
    description: "도시의 날씨 정보를 반환합니다.",
    inputSchema: { city: z.string() }
  },
  async ({ city }) => {
    // 구현 로직
  }
);
```

**특징:**
- 상세한 메타데이터 (title, description)
- LLM이 더 잘 이해할 수 있는 명확한 설명
- 확장 가능한 구조

### Resource 등록 방식 비교

#### 1. 기본 `resource()` 방식
```typescript
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `안녕하세요, ${name}님!`
    }]
  })
);
```

**특징:**
- ResourceTemplate 객체 사용
- 변수 추출이 자동으로 처리됨
- 간단한 구조

#### 2. 상세 `registerResource()` 방식
```typescript
server.registerResource(
  "user_profile",
  "user_profile://{username}",
  {
    title: "사용자 프로필 정보",
    description: "username에 해당하는 사용자의 프로필 정보를 반환합니다."
  },
  async (uri: URL) => {
    const username = uri.pathname.split('/').pop() || 'unknown';
    // 구현 로직
  }
);
```

**특징:**
- URI 템플릿을 문자열로 직접 지정
- 메타데이터 객체로 상세 정보 제공
- URL 파싱을 수동으로 처리해야 함

### API 시그니처 정리

#### Tool API
```typescript
// 기본 방식
tool(name: string, paramsSchema: ZodRawShape, callback: ToolCallback): RegisteredTool

// 상세 방식
registerTool(name: string, config: {
  title?: string;
  description?: string;
  inputSchema?: ZodRawShape;
}, callback: ToolCallback): RegisteredTool
```

#### Resource API
```typescript
// 기본 방식
resource(name: string, template: ResourceTemplate, callback: ReadResourceTemplateCallback): RegisteredResourceTemplate

// 상세 방식
registerResource(name: string, uriTemplate: string, config: ResourceMetadata, callback: ReadResourceCallback): RegisteredResource
```

### 권장 사용 패턴

| 상황 | Tool | Resource |
|------|------|----------|
| **빠른 프로토타이핑** | `tool()` | `resource()` |
| **프로덕션 서비스** | `registerTool()` | `registerResource()` |
| **학습/테스트** | `tool()` | `resource()` |
| **실제 배포** | `registerTool()` | `registerResource()` |

### 실제 사용 예시

#### Tool 사용
```
사용자: "서울의 날씨를 알려줘"
LLM: get_weather 도구 호출 → "서울의 현재 날씨: 맑음, 기온: 15°C, 습도: 65%" 반환

사용자: "5와 3을 더해줘"
LLM: add 도구 호출 → 8 반환
```

#### Resource 사용
```
사용자: "홍길동에게 인사해줘"
LLM: greeting://홍길동 리소스 접근 → "안녕하세요, 홍길동님!" 반환

사용자: "김철수의 프로필을 보여줘"
LLM: user_profile://김철수 리소스 접근 → 랜덤 프로필 정보 반환
```

---

## LLM 활용을 위한 최적화

### Tool 설명 개선 방법

#### 1. 주석과 문서화 사용
```typescript
/**
 * 두 숫자를 더하는 계산 도구
 * @param a - 첫 번째 숫자
 * @param b - 두 번째 숫자
 * @returns 두 숫자의 합
 */
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);
```

#### 2. 도구 메타데이터 추가 (지원되는 경우)
```typescript
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  }),
  {
    description: "두 숫자를 더하는 계산 도구입니다. 수학 계산이나 금액 합계 등에 사용할 수 있습니다."
  }
);
```

### Resource 설명 개선 방법

#### 1. 리소스 템플릿 설명 추가
```typescript
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { 
    list: undefined,
    description: "사용자 이름을 받아 인사말을 생성하는 리소스입니다."
  }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `안녕하세요, ${name}님!`
    }]
  })
);
```

#### 2. 주석과 문서화 사용
```typescript
/**
 * 사용자 이름을 받아 인사말을 생성하는 리소스
 * @param name - 인사할 대상의 이름
 * @returns 인사말 텍스트
 */
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `안녕하세요, ${name}님!`
    }]
  })
);
```

### LLM이 잘 활용할 수 있도록 하는 포인트

1. **명확한 설명**: 각 도구와 리소스의 용도를 명확히 설명
2. **매개변수 설명**: 입력값의 의미와 형식을 자세히 기술
3. **사용 예시**: 언제 어떤 상황에서 사용하는지 예시 제공
4. **에러 처리**: 잘못된 입력에 대한 적절한 에러 메시지
5. **일관성**: 비슷한 기능의 도구들은 일관된 네이밍과 구조 사용

---

## Transport 방식 이해

### StdioServerTransport

#### 정의
- **표준 입출력(Standard Input/Output)**을 통한 통신 방식
- `stdin`과 `stdout`을 사용하여 JSON-RPC 메시지를 주고받음
- CLI 도구나 다른 프로세스와 쉽게 연결 가능

#### 왜 필요한가?
1. **프로세스 간 통신**: MCP 서버와 클라이언트가 별도 프로세스로 실행
2. **표준화된 인터페이스**: 모든 플랫폼에서 동일하게 작동
3. **간단한 설정**: 복잡한 네트워크 설정 없이 바로 사용 가능

#### 사용 예시
```bash
# CLI에서 직접 실행
node dist/index.js

# 다른 프로세스와 파이프로 연결
echo '{"method":"tools/list"}' | node dist/index.js
```

### 다른 Transport 방식들

#### 1. WebSocketTransport
- 웹 브라우저와 실시간 통신
- 양방향 통신 지원
- 웹 애플리케이션에서 사용

#### 2. HttpTransport
- HTTP API로 통신
- RESTful API 형태
- 웹 서비스에서 사용

#### 3. TcpTransport
- TCP 소켓으로 통신
- 네트워크를 통한 직접 연결
- 고성능이 필요한 경우 사용

---

## 실제 구현 예제

### 기본 MCP 서버 구조

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// MCP 서버 인스턴스 생성
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

// Tool 등록 (간단한 방식)
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Tool 등록 (상세한 방식 - registerTool 사용)
server.registerTool(
  "get_weather",
  {
    title: "날씨 조회",
    description: "도시의 날씨 정보를 반환합니다.",
    inputSchema: { city: z.string() }
  },
  async ({ city }) => {
    // 랜덤 날씨 정보 생성
    const weatherConditions = [
      "맑음", "흐림", "비", "눈", "안개", "구름 많음", "천둥번개"
    ];
    const temperatures = Array.from({ length: 41 }, (_, i) => i - 10); // -10도 ~ 30도
    const humidities = Array.from({ length: 101 }, (_, i) => i); // 0% ~ 100%
    
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
    const randomHumidity = humidities[Math.floor(Math.random() * humidities.length)];
    
    return {
      content: [{ 
        type: "text", 
        text: `${city}의 현재 날씨: ${randomWeather}, 기온: ${randomTemp}°C, 습도: ${randomHumidity}%` 
      }]
    };
  }
);

// Resource 등록 (기본 방식)
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `안녕하세요, ${name}님!`
    }]
  })
);

// Resource 등록 (상세한 방식 - registerResource 사용)
server.registerResource(
  "user_profile",
  "user_profile://{username}",
  {
    title: "사용자 프로필 정보",
    description: "username에 해당하는 사용자의 프로필 정보를 반환합니다."
  },
  async (uri: URL) => {
    const username = uri.pathname.split('/').pop() || 'unknown';
    
    // 랜덤 사용자 정보 생성
    const roles = ["개발자", "디자이너", "기획자", "마케터", "관리자"];
    const departments = ["개발팀", "디자인팀", "기획팀", "마케팅팀", "인사팀"];
    const locations = ["서울", "부산", "대구", "인천", "광주", "대전"];
    
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomDept = departments[Math.floor(Math.random() * departments.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomAge = Math.floor(Math.random() * 30) + 25; // 25~54세
    const randomExperience = Math.floor(Math.random() * 10) + 1; // 1~10년
    
    return {
      contents: [{
        uri: uri.href,
        text: `사용자: ${username}\n직책: ${randomRole}\n부서: ${randomDept}\n위치: ${randomLocation}\n나이: ${randomAge}세\n경력: ${randomExperience}년`
      }]
    };
  }
);

// Transport 연결
const transport = new StdioServerTransport();
await server.connect(transport);
```

### package.json 설정

```json
{
  "name": "poc-node-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "npm run build && npm run start"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.16.0",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/node": "^24.0.15",
    "typescript": "^5.8.3"
  }
}
```

---

## Gemini CLI 연동

### .gemini/settings.json 설정

```json
{
  "mcpServers": {
    "demo-mcp-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": ".",
      "description": "Demo MCP 서버 - add 도구와 greeting 리소스 제공",
      "metadata": {
        "version": "1.0.0",
        "author": "Demo"
      }
    }
  },
  "defaultModel": "gemini-1.5-flash",
  "temperature": 0.7,
  "maxTokens": 4096
}
```

### 사용 방법

1. **MCP 서버 빌드**
   ```bash
   npm run build
   ```

2. **Gemini CLI 실행**
   ```bash
   gemini
   ```

3. **도구 사용 예시**
   ```
   사용자: "5와 3을 더해줘"
   Gemini: add 도구를 사용하여 8을 반환
   ```

4. **리소스 사용 예시**
   ```
   사용자: "홍길동에게 인사해줘"
   Gemini: greeting://홍길동 리소스에 접근하여 "안녕하세요, 홍길동님!" 반환
   ```

---

## 학습 체크리스트

- [ ] MCP 서버 기본 구조 이해
- [ ] Tool과 Resource의 차이점 파악
- [ ] LLM 활용을 위한 설명 작성법 학습
- [ ] Transport 방식 이해
- [ ] 실제 MCP 서버 구현
- [ ] Gemini CLI와 연동
- [ ] 다양한 도구와 리소스 추가 구현

---

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [Gemini CLI 문서](https://ai.google.dev/docs/gemini_cli)

---

*이 가이드는 MCP 서버 개발의 기초를 다지고, LLM과의 효과적인 연동을 위한 학습 자료입니다.* 