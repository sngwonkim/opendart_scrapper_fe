'use client';

import { useState } from 'react';

type FinancialData = {
  rcept_no: string;
  bsns_year: string;
  sj_nm: string;
  account_nm: string;
  thstrm_amount: string;
};

export default function Home() {
  const [startYear, setStartYear] = useState('2022');
  const [endYear, setEndYear] = useState('2022');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadCSV = (data: FinancialData[]) => {
    if (data.length === 0) {
      setError("조회는 성공했으나, 다운로드할 데이터가 없습니다.");
      return;
    }

    const headers = ['사업연도', '재무제표명', '계정명', '계정ID', '당기금액(원)', '전기금액(원)'];
    const sortedData = [...data].sort((a, b) => {
      if (a.bsns_year !== b.bsns_year) {
        return parseInt(b.bsns_year) - parseInt(a.bsns_year);
      }
      return a.account_nm.localeCompare(b.account_nm);
    });

    const rows = sortedData.map(item => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const corpCode = '00244455';
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/financials/${corpCode}?start_year=${startYear}&end_year=${endYear}`;

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

      handleDownloadCSV(data.data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex justify-center items-start sm:items-center py-8">
      {/* 폭을 너무 넓히지 말고, 불필요 여백 축소 */}
      <div className="w-full max-w-3xl px-4">
        <header className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-green-400">
            KT&G 재무 데이터 스크래퍼
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            금융감독원 DART에서 연결재무상태표(CFS)와 연결손익계산서(CIS)를<br className="hidden sm:inline" />
            선택 기간별로 통합하여 하나의 CSV 파일로 추출합니다.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="w-full bg-gray-800 p-6 sm:p-7 rounded-lg shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-5 border-b border-gray-700 pb-3">
            데이터 추출 기간 설정
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              요청하시는 사업연도 범위
            </label>

            {/* 좁은 간격의 그리드로 정렬, 모바일=세로, 데스크탑=가로 */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                // 연도 표시 문제: 밝은 배경 + 어두운 텍스트로 가시성 확보
                className="w-full p-3 bg-white text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {[...Array(15)].map((_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}년
                  </option>
                ))}
              </select>

              <span className="text-center font-bold text-lg sm:text-xl">~</span>

              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-full p-3 bg-white text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {[...Array(15)].map((_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}년
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            // 파란색 버튼 + 여백 축소
            className="w-full p-4 bg-blue-600 rounded-md font-bold text-lg hover:bg-blue-700 disabled:bg-gray-500 transition duration-200 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                데이터 생성 중... (DART API 호출)
              </div>
            ) : (
              'CSV 다운로드'
            )}
          </button>
        </form>

        <div className="mt-4">
          {error && (
            <div className="bg-red-900 text-white p-4 rounded-md border border-red-500 shadow">
              <p className="font-bold mb-1">⚠️ 오류 발생</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <footer className="text-center mt-6 text-gray-500 text-sm">
          <p>본 시스템은 인하대학교 디지털전략혁신센터에서 제작되었습니다.</p>
        </footer>
      </div>
    </main>
  );
}
