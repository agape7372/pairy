// @webtoon/psd 는 ESM + 바이너리(WASM) 파서라 jsdom 유닛 테스트 환경에서 그대로 로드하면
// `Unexpected token 'export'` 로 스위트가 아예 실행되지 않는다.
// psdParser 의 순수 유틸(formatFileSize/validatePSDFile/generateMappingSuggestions/convertToTemplateData)은
// 이 라이브러리를 런타임에 호출하지 않으므로, 테스트에서만 default export 를 스텁으로 격리한다.
// 실제 PSD 파싱 경로를 테스트할 때는 별도의 통합 테스트에서 실 모듈을 사용해야 한다.
module.exports = { __esModule: true, default: {} }
