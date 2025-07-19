#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('MCP 서버 테스트를 시작합니다...\n');

// MCP 서버 프로세스 시작
const mcpServer = spawn('node', ['dist/index.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

// 서버 출력 로그
mcpServer.stdout.on('data', (data) => {
  console.log('서버 출력:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.log('서버 오류:', data.toString());
});

// 서버가 준비될 때까지 잠시 대기
setTimeout(() => {
  console.log('\n=== MCP 서버 테스트 ===');
  
  // tools/list 요청 (사용 가능한 도구 목록 조회)
  const toolsListRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  };
  
  console.log('요청:', JSON.stringify(toolsListRequest, null, 2));
  mcpServer.stdin.write(JSON.stringify(toolsListRequest) + '\n');
  
  // 2초 후 resources/list 요청
  setTimeout(() => {
    const resourcesListRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "resources/list"
    };
    
    console.log('\n요청:', JSON.stringify(resourcesListRequest, null, 2));
    mcpServer.stdin.write(JSON.stringify(resourcesListRequest) + '\n');
    
    // 3초 후 서버 종료
    setTimeout(() => {
      console.log('\n테스트 완료. 서버를 종료합니다...');
      mcpServer.kill();
      process.exit(0);
    }, 3000);
    
  }, 2000);
  
}, 1000);

// 프로세스 종료 처리
mcpServer.on('close', (code) => {
  console.log(`\nMCP 서버가 종료되었습니다. (코드: ${code})`);
  process.exit(0);
});

mcpServer.on('error', (error) => {
  console.error('MCP 서버 실행 중 오류:', error);
  process.exit(1);
}); 