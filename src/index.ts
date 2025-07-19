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
// z.number()를 사용해 입력값이 숫자인지 검사합니다.
server.tool(
  'add',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
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

// StdioServerTransport를 생성하여 표준 입출력을 통해 서버와 클라이언트가 통신할 수 있도록 합니다.
const transport = new StdioServerTransport();

// 서버를 transport(표준 입출력)와 연결하여 클라이언트의 요청을 받을 준비를 합니다.
await server.connect(transport);
