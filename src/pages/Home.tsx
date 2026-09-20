import HighlightedProducts from '../components/HighlightedProducts/HighlightedProducts';
import Slider from '../components/Slider/Slider';
import Stats from '../components/Stats/Stats';

export default function Home() {
  return (
    <>
      <Slider />
      <HighlightedProducts />
      <Stats />
    </>
  );
}
