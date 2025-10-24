export default function Home() {
  return (
    <main className="container py-14">
      <h1 className="text-4xl font-bold">SmartPicture – Next 16 Auth UI</h1>
      <p className="mt-3 text-gray-600">Email/Password & Google login. Tailwind v3. Webpack build (no Turbopack).</p>
      <ul className="list-disc pl-6 mt-4 text-gray-700">
        <li><b>/register</b> – 创建账户</li>
        <li><b>/login</b> – 登录账户</li>
        <li><b>/dashboard</b> – 个人仪表盘</li>
        <li><b>/admin</b> – 管理后台（需 role: "admin"）</li>
      </ul>
    </main>
  );
}
