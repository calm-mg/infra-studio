# 인프라 스튜디오

백엔드 개발자가 팀 서비스의 블록과 연결을 그리고 요청·데이터 경로를 설명하는 **데스크톱 웹 편집기**. 설계는 브라우저에서 처리한다. 파일 전달은 복사본 전달이며 계정 동기화가 아니다.

[제품 범위·인수 조건](docs/product-brief.md) · [기획 단계 UI](docs/prototypes/infra-studio-v2.html) · [AI 작업 계약](AGENTS.md)

## 실행

Node 24와 npm이 필요하다(`.nvmrc` 참조). 이 서버에서는 `export PATH=/opt/yoom-ci/node-v24.22.3-linux-arm64/bin:$PATH`로 기존 설치를 사용할 수 있다.

```sh
npm ci
npm run dev
```

같은 컴퓨터에서는 터미널의 로컬 주소를 연다. 원격 서버에서 개발할 때는 SSH 포트 포워딩으로 해당 포트를 PC에 연결한다. 개발 서버를 인터넷에 공개할 필요는 없다.

## 첫 검수

1. 빈 캔버스에 앱 서버와 데이터베이스를 추가한다. 각각 `주문 서비스`, `주문 DB`로 이름을 바꾼다.
2. 주문 서비스를 선택하고 **연결 시작**을 누른 뒤 주문 DB를 클릭한다. 관계 이름을 `주문 조회`로 입력한다.
3. **파일 내보내기**로 JSON을 내려받는다. 시크릿 창에서 새로 앱을 열고 그 파일을 불러온다. 두 이름과 서비스 → DB 방향의 `주문 조회` 선이 그대로 있어야 한다.
4. 사람이 판단할 것: 처음 보는 사람도 두 블록을 구분하고 화살표의 의미를 설명할 수 있는가? 성공한 자동 검사가 이 질문을 대신하지 않는다.

## 검증

```sh
npm run typecheck
npm test
npm run build
npx playwright install --only-shell chromium
npm run test:e2e
```

단위 검사는 설계 파일·편집 규칙을 다루고, Playwright는 빌드 결과(`apps/web/dist/`)를 127.0.0.1:4173에서 띄워 실제 버튼과 파일 입출력을 사용한다. 이 포트는 비워 둔다. 새 Linux 머신은 관리자가 최초 한 번 Chromium의 OS 의존성을 설치해야 한다(`npx playwright install-deps chromium`, 한글 표시에는 CJK 글꼴 권장).

### Jenkins

- 이 공개 저장소를 새 Multibranch Pipeline에 연결하고 Script Path는 `Jenkinsfile`로 둔다. GitHub App 설치 대상에 이 저장소를 추가하고 커밋 상태 보고 권한을 확인한다. **동일 저장소의 신뢰된 브랜치와 PR만** 빌드한다. Fork PR discovery를 끄고 외부 기여자의 Jenkinsfile이나 코드를 공유 에이전트에서 자동 실행하지 않는다.
- 기존 `linux-arm64` 에이전트와 `/opt/yoom-ci`의 Node를 사용한다. npm 레지스트리·Playwright 다운로드에 접근할 수 있어야 하며 Chromium OS 의존성은 호스트에 준비한다. Jenkins 컨트롤러나 Docker에서 브라우저를 실행하지 않는다.
- Jenkins의 Tests 탭에서 단위·브라우저 검사 결과를 확인한다(JUnit 플러그인 필요). 성공한 빌드는 새 세션에서 복원한 화면 `roundtrip.png`를 남긴다. 브라우저 검사 실패 시 `trace.zip`을 내려받고 `npx playwright show-trace <파일경로>`로 실패 직전 클릭과 화면을 재생한다. CI는 검증만 하며 공개 배포하지 않는다.

## 저장소 경계

- `apps/web/src/design/`: 버전 있는 설계 모델과 파일 검사. React 비의존.
- `apps/web/src/catalog/`, `apps/web/src/editor/`: 역할·예제, 캔버스와 설정 UI.
- `e2e/`: 실제 브라우저에서 재현할 사용자 행동. `artifacts/` 결과물은 커밋하지 않는다.
- `apps/backend/`는 로그인·동기화가 필요해질 때 추가한다. 지금은 서버나 DB 없이 실행한다.
