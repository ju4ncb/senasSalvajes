import { flatRoutes } from "@react-router/fs-routes";

// flatRoutes() is async, so we must await it at the top level
const routes = await flatRoutes();
console.log("Routes loaded:", routes);

export default routes;
