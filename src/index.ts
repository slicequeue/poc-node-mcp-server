#!/usr/bin/env node

// MCP 서버와 관련된 클래스와 함수들을 import 합니다.
// McpServer: MCP 서버 인스턴스를 생성할 때 사용합니다.
// ResourceTemplate: 리소스의 URI 템플릿을 정의할 때 사용합니다.
// StdioServerTransport: 표준 입출력을 통해 서버와 클라이언트가 통신할 수 있게 해줍니다.
// z: 입력값의 유효성 검사를 위한 라이브러리입니다.
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * 로깅 유틸리티
 */
const log = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  tool: (name: string, params: any, result: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] TOOL_CALL: ${name}`);
    console.log(`  Parameters: ${JSON.stringify(params, null, 2)}`);
    console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
    console.log('---');
  },
  resource: (name: string, uri: string, result: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] RESOURCE_ACCESS: ${name}`);
    console.log(`  URI: ${uri}`);
    console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
    console.log('---');
  }
};

/**
 * 도구 실행을 래핑하는 헬퍼 함수
 */
const withLogging = <T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      log.info(`${name} 호출됨`, args[0]);
      const result = await fn(...args);
      log.tool(name, args[0], result);
      return result;
    } catch (error) {
      log.error(`${name} 실행 중 오류 발생`, error);
      throw error;
    }
  };
};

/**
 * 리소스 실행을 래핑하는 헬퍼 함수
 */
const withResourceLogging = <T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      const uri = args[0]?.href || 'unknown';
      log.info(`${name} 리소스 접근됨 - URI: ${uri}`);
      const result = await fn(...args);
      log.resource(name, uri, result);
      return result;
    } catch (error) {
      log.error(`${name} 리소스 실행 중 오류 발생`, error);
      throw error;
    }
  };
};

/**
 * Demo MCP 서버
 * 
 * 이 서버는 LLM이 다양한 작업을 수행할 수 있도록 도구(Tools)와 리소스(Resources)를 제공합니다.
 * 
 * 제공하는 기능:
 * - 수학 계산: 두 숫자의 덧셈
 * - 날씨 정보: 도시별 랜덤 날씨 정보 조회
 * - 사용자 프로필: 랜덤 사용자 정보 생성
 * - 인사말: 사용자 이름을 받아 인사말 생성
 * 
 * 사용 예시:
 * - "5와 3을 더해줘" → add 도구 사용
 * - "서울의 날씨를 알려줘" → get_weather 도구 사용
 * - "홍길동의 프로필을 보여줘" → user_profile 리소스 접근
 * - "김철수에게 인사해줘" → greeting 리소스 접근
 */
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
  description: "다양한 계산 도구와 사용자 정보 리소스를 제공하는 MCP 서버입니다. 수학 계산, 날씨 정보 조회, 사용자 프로필 생성 등의 기능을 지원합니다."
});

log.info("MCP 서버가 시작되었습니다.", { name: "Demo", version: "1.0.0" });

/**
 * 수학 계산 도구: add
 * 
 * 두 숫자를 입력받아 그 합을 반환합니다.
 * 
 * 매개변수:
 * - a: 첫 번째 숫자 (number)
 * - b: 두 번째 숫자 (number)
 * 
 * 반환값: 두 숫자의 합 (string)
 * 
 * 사용 예시:
 * - 입력: {a: 5, b: 3} → 출력: "8"
 * - 입력: {a: 10, b: 20} → 출력: "30"
 */
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  withLogging('add', async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  }))
);

/**
 * 날씨 정보 조회 도구: get_weather
 * 
 * 도시 이름을 입력받아 해당 도시의 랜덤 날씨 정보를 반환합니다.
 * 기온, 습도, 날씨 상태를 포함한 상세한 정보를 제공합니다.
 * 
 * 매개변수:
 * - city: 도시 이름 (string)
 * 
 * 반환값: 날씨 정보 문자열 (string)
 * 
 * 사용 예시:
 * - 입력: {city: "서울"} → 출력: "서울의 현재 날씨: 맑음, 기온: 15°C, 습도: 65%"
 * - 입력: {city: "부산"} → 출력: "부산의 현재 날씨: 흐림, 기온: 8°C, 습도: 80%"
 */
server.registerTool(
  "get_weather",
  {
    title: "날씨 조회",
    description: "도시의 날씨 정보를 반환합니다. 기온, 습도, 날씨 상태를 포함한 상세한 정보를 제공합니다.",
    inputSchema: { city: z.string() }
  },
  withLogging('get_weather', async ({ city }) => {
    // 랜덤 날씨 정보 생성
    const weatherConditions = ["맑음", "흐림", "비", "눈", "안개", "구름 많음", "천둥번개"];
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
  })
);

/**
 * 인사말 리소스: greeting
 * 
 * 사용자 이름을 받아 인사말을 생성하는 리소스입니다.
 * URI 형태: greeting://{name}
 * 
 * 매개변수:
 * - name: 인사할 대상의 이름 (string)
 * 
 * 반환값: 인사말 텍스트 (string)
 * 
 * 사용 예시:
 * - URI: greeting://홍길동 → 출력: "안녕하세요, 홍길동님!"
 * - URI: greeting://김철수 → 출력: "안녕하세요, 김철수님!"
 */
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  withResourceLogging('greeting', async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `안녕하세요, ${name}님!`
    }]
  }))
);

/**
 * 사용자 프로필 리소스: user_profile
 * 
 * 사용자 이름을 받아 랜덤한 프로필 정보를 생성하는 리소스입니다.
 * URI 형태: user_profile://{username}
 * 
 * 매개변수:
 * - username: 사용자 이름 (string)
 * 
 * 반환값: 사용자 프로필 정보 (string)
 * 
 * 포함 정보:
 * - 직책: 개발자, 디자이너, 기획자, 마케터, 관리자 중 랜덤
 * - 부서: 개발팀, 디자인팀, 기획팀, 마케팅팀, 인사팀 중 랜덤
 * - 위치: 서울, 부산, 대구, 인천, 광주, 대전 중 랜덤
 * - 나이: 25~54세 중 랜덤
 * - 경력: 1~10년 중 랜덤
 * 
 * 사용 예시:
 * - URI: user_profile://홍길동 → 출력: "사용자: 홍길동\n직책: 개발자\n부서: 개발팀\n위치: 서울\n나이: 32세\n경력: 5년"
 */
server.registerResource(
  "user_profile",
  new ResourceTemplate("user_profile://{username}", { list: undefined }),
  {
    title: "사용자 프로필 정보",
    description: "username에 해당하는 사용자의 프로필 정보를 반환합니다. 직책, 부서, 위치, 나이, 경력 등의 정보를 포함합니다."
  },
  withResourceLogging('user_profile', async (uri: URL) => {
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
  })
);

// StdioServerTransport를 생성하여 표준 입출력을 통해 서버와 클라이언트가 통신할 수 있도록 합니다.
const transport = new StdioServerTransport();

log.info("Transport 연결을 시작합니다...");

// 서버를 transport(표준 입출력)와 연결하여 클라이언트와 통신할 수 있도록 합니다.
await server.connect(transport);

log.info("MCP 서버가 성공적으로 시작되었습니다. LLM 요청을 기다리는 중...");
