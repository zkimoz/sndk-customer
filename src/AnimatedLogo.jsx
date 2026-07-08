import Spline from '@splinetool/react-spline';

export default function AnimatedLogo({ style }) {
  return (
    <Spline
      scene="https://prod.spline.design/2FNDz1zXFmbIw2I7/scene.splinecode"
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
