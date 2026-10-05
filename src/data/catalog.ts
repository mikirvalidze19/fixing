import source from "../../tecfi-georgia-planning/data/products.json";
import type { Application, Product } from '../models/catalog';

export type { Application, Product, Variant } from '../models/catalog';

export const products = source.products as Product[];
export const applications = (
  source as unknown as { applications?: Application[] }
).applications ?? [];
export const featuredProducts = ["hxe01", "aje", "zze", "chemical-anchors"]
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is Product => Boolean(product));
