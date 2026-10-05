/* Shared models: site navigation.
 * Single definition for the { label, to, children? } shape that was
 * previously triplicated as NavRoute (App), ChildLink (Header) and
 * NavLink (data/siteInfo). */

export type NavLink = {
  label: string;
  to: string;
  children?: NavLink[];
};

/* Header main-nav entry: a NavLink that may open the mega menu. */
export type NavItem = NavLink & {
  menu?: string;
};
