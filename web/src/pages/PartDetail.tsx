import { useParams } from 'react-router-dom';

export default function PartDetail() {
  const { partId } = useParams();
  return <h1 className="text-[24px] font-semibold">Part {partId}</h1>;
}
