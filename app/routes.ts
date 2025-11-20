import { flatRoutes } from "@react-router/fs-routes";

// flatRoutes() is async, so we must await it at the top level
const routes = await flatRoutes();

export default routes;
