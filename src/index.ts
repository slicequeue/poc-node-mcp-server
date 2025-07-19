// MCP 서버와 관련된 클래스와 함수들을 import 합니다.
// McpServer: MCP 서버 인스턴스를 생성할 때 사용합니다.
// ResourceTemplate: 리소스의 URI 템플릿을 정의할 때 사용합니다.
// StdioServerTransport: 표준 입출력을 통해 서버와 클라이언트가 통신할 수 있게 해줍니다.
// z: 입력값의 유효성 검사를 위한 라이브러리입니다.
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// MCP 서버 인스턴스를 생성합니다.
// name과 version은 서버의 이름과 버전을 나타냅니다.
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

// 서버에 'add'라는 이름의 도구(tool)를 등록합니다.
// 이 도구는 두 개의 숫자(a, b)를 입력받아 그 합을 반환합니다.
// 간단한 방식으로 등록합니다.
server.tool(
  'add',
  {
    a: z.number(),
    b: z.number()
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// get_weather 툴 등록 (registerTool 사용)
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

// 서버에 'greeting'이라는 리소스를 등록합니다.
// greeting://{name} 형태의 URI를 사용하며, {name} 부분에 이름이 들어갑니다.
// 이 리소스에 접근하면 "안녕하세요, {name}님!"이라는 인사말을 반환합니다.
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

// user_profile 리소스 등록 (registerResource 방식 사용)
server.registerResource(
  "user_profile",
  new ResourceTemplate("user_profile://{username}", { list: undefined }),
  {
    title: "사용자 프로필 정보",
    description: "username에 해당하는 사용자의 프로필 정보를 반환합니다."
  },
  async (uri, { username }) => {
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

// StdioServerTransport를 생성하여 표준 입출력을 통해 서버와 클라이언트가 통신할 수 있도록 합니다.
const transport = new StdioServerTransport();

// 서버를 transport(표준 입출력)와 연결하여 클라이언트의 요청을 받을 준비를 합니다.
await server.connect(transport);
