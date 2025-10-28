'use client';

import { useState } from 'react';

// 백엔드 API로부터 받을 데이터의 타입 정의
type FinancialData = {
  rcept_no: string;
  bsns_year: string;
  sj_nm: string; // 재무제표명 (예: '연결재무상태표' 또는 '연결손익계산서')
  account_nm: string; // 백엔드에서 정제한 한글 이름
  thstrm_amount: string;
};

export default function Home() {
  // 1. 폼 입력을 위한 '상태(state)'
  const [startYear, setStartYear] = useState('2022');
  const [endYear, setEndYear] = useState('2022');
  
  // [삭제] 'items' (체크박스) 상태 제거

  // 2. API 응답을 저장하기 위한 '상태(state)'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // [삭제] 'results' (필터링된 결과) 상태 제거

  
  // 3. 이벤트 핸들러 (동작 함수)
  
  // [신규] CSV 다운로드 핸들러
  // handleSubmit에서 직접 호출됩니다.
  const handleDownloadCSV = (data: FinancialData[]) => {
    if (data.length === 0) {
        setError("조회는 성공했으나, 다운로드할 데이터가 없습니다.");
        return;
    }

    // 1. CSV 헤더 정의 (더 많은 정보 포함)
    const headers = ['사업연도', '재무제표명', '계정명', '계정ID', '당기금액(원)', '전기금액(원)'];
    
    // 2. CSV 데이터 행 생성
    // 연도 내림차순, 그 다음 계정명 오름차순으로 정렬
    const sortedData = [...data].sort((a, b) => {
        if (a.bsns_year !== b.bsns_year) {
            return parseInt(b.bsns_year) - parseInt(a.bsns_year);
        }
        return a.account_nm.localeCompare(b.account_nm);
    });
    
    const rows = sortedData.map(item => {
        // DART API의 원본 필드명을 사용 (thstrm_amount, frmtrm_amount)
        const thstrm_amount = (item as any).thstrm_amount || '0';
        const frmtrm_amount = (item as any).frmtrm_amount || '0';
        const account_id = (item as any).account_id || '';

        return [
            item.bsns_year,
            `"${item.sj_nm}"`,
            `"${item.account_nm}"`,
            `"${account_id}"`,
            thstrm_amount,
            frmtrm_amount
        ].join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ktng_financials_CFS_CIS_${startYear}_${endYear}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // "데이터 다운로드" 버튼 클릭 시 (API 호출)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const corpCode = '00244455'; // KT&G 고유 코드

    const apiUrl = `http://127.0.0.1:8000/api/financials/${corpCode}?start_year=${startYear}&end_year=${endYear}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API 요청 실패: ${response.statusText}`);

      const data = await response.json();
      
      if (data.data && data.data.error) {
          throw new Error(`DART API 오류: ${data.data.error}`);
      }
      
      if (!Array.isArray(data.data)) {
          throw new Error("백엔드로부터 잘못된 형식의 데이터를 받았습니다.");
      }

      // [핵심 수정]
      // 데이터를 필터링하거나 'results' 상태에 저장하지 않고,
      // 받은 'data.data' (전체 데이터)를 CSV 다운로드 함수로 즉시 전달합니다.
      handleDownloadCSV(data.data);
      
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  

  // 4. UI 렌더링 (JSX)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-10">
      <div className="w-full max-w-lg"> {/* 너비 조절 (max-w-3xl -> max-w-lg) */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">
            KT&G 재무제표 데이터 다운로드
          </h1>
          <p className="text-gray-400">
            금융감독원의 전자공시 시스템에서 KT&G의 연결재무상태표와
            <br /> {/* <-- 여기에 <br /> 태그를 추가하세요 */}
            연결손익계산서를 간편하게 가져와 하나의 CSV 파일로 저장합니다.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">다운로드할 기간을 선택하세요.</h2>
          
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              요청하시는 기간
            </label>
            <div className="flex gap-4">
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-1/2 p-3 bg-gray-700 rounded-md border border-gray-600"
              >
                {[...Array(15)].map((_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}년
                  </option>
                ))}
              </select>
              <span className="flex items-center">~</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-1/2 p-3 bg-gray-700 rounded-md border border-gray-600"
              >
                {[...Array(15)].map((_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}년
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* [삭제] "필요하신 항목" 체크박스 영역 제거됨 */}

          <button
            type="submit"
            className="w-full p-4 bg-green-600 rounded-md font-bold text-lg hover:bg-green-700 disabled:bg-gray-500"
            disabled={loading}
          >
            {/* [수정] 버튼 텍스트 변경 */}
            {loading ? '데이터 생성 중...' : 'CSV 다운로드'}
          </button>
        </form>

        {/* [삭제] "결과 표시 영역" 테이블 제거됨 */}
        
        {/* 에러 메시지만 하단에 표시 */}
        <div className="mt-6 w-full">
          {error && (
            <div className="bg-red-800 text-white p-4 rounded-md">
              <p><b>오류 발생:</b> {error}</p>
            </div>
          )}
        </div>

        <footer className="text-center mt-10 text-gray-500 text-sm">
          인하대학교 디지털전략혁신센터
        </footer>
      </div>
    </main>
  );
}