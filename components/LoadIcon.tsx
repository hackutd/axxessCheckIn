import Image from 'next/image';
export interface LoadIconProps {
  width: number;
  height: number;
}
export default function LoadIcon({ width, height }: LoadIconProps) {
  return (
    <img
      alt="iwannakms"
      src="http://pa1.narvii.com/7307/b1d516d779ff4c29cbeb69ac5fe7250511fd1e12r1-250-250_00.gif"
      width={width}
      height={height}
    />
  );
}
