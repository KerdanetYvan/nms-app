import Svg, { Circle, Ellipse } from "react-native-svg";

type Props = { size?: number };

export function EyesLogo({ size = 120 }: Props) {
  const height = Math.round((size * 60) / 109);
  return (
    <Svg width={size} height={height} viewBox="0 0 109 60" fill="none">
      <Ellipse cx="29.4134" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="46.5277" cy="29.5277" r="8.02766" fill="#7A6678" />
      <Ellipse cx="79.5863" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="96.7005" cy="29.5277" r="8.02766" fill="#7A6678" />
    </Svg>
  );
}
