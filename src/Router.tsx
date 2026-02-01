import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { HomePage } from './pages/Home.page';
import { IFramePage } from './pages/IFrame.page';
import { MarkdownPage } from './pages/Markdown';

const router = createBrowserRouter([
  {
    path: '/markdown-view',
    element: <MarkdownPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/markdown',
        element: <MarkdownPage />,
      },
      {
        path: '/iframe',
        element: <IFramePage />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
