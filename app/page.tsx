{/* 顶部 Header：移除版本号，保持极简高级感 */}
<header className="w-full max-w-6xl mx-auto flex justify-between items-center px-6 py-6 border-b border-gray-800/60">
  <div className="flex items-center gap-3">
    {/* 独家品牌 Icon */}
    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/20 border border-white/10">
      A
    </div>
    <div className="flex flex-col text-left">
      <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none">
        AIO Pulse
      </span>
      <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-1">
        Brand GEO Intelligence
      </span>
    </div>
  </div>

  <div className="flex items-center gap-3">
    {/* 仅保留多语言选择器 */}
    <div className="relative inline-block">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="bg-gray-900 border border-gray-800 text-xs text-gray-200 font-medium px-3.5 py-1.5 rounded-full outline-none focus:border-blue-500 cursor-pointer transition-all"
      >
        <option value="en">🇬🇧 English</option>
        <option value="zh">🇨🇳 简体中文</option>
        <option value="es">🇪🇸 Español</option>
        <option value="de">🇩🇪 Deutsch</option>
        <option value="fr">🇫🇷 Français</option>
        <option value="ja">🇯🇵 日本語</option>
      </select>
    </div>
  </div>
</header>