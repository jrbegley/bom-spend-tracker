import { useParams } from 'react-router-dom';

export default function LevelPage() {
  const params = useParams();
  const nodePath = (params['*'] ?? '').split('/').filter(Boolean);
  return (
    <>
      <h1 className="text-[24px] font-semibold">Level page</h1>
      <p className="text-text-secondary">{[params.productId, ...nodePath].join(' / ')}</p>
    </>
  );
}
