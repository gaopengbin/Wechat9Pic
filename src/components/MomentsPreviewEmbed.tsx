/**
 * MomentsPreviewEmbed - 内嵌版朋友圈预览组件
 * 用于右侧预览区
 */

import { useState, useEffect, useCallback } from 'react';
import type { ImageData, ProcessedImage } from '@/types';
import type { MomentsSettings } from '@/services/ProjectStorage';

// 微信同款表情
const WECHAT_EMOJI_BASE = 'https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/';
const WECHAT_EMOJIS: { name: string; code: string }[] = [
  { name: '微笑', code: '0' }, { name: '撇嘴', code: '1' }, { name: '色', code: '2' }, { name: '发呆', code: '3' },
  { name: '得意', code: '4' }, { name: '流泪', code: '5' }, { name: '害羞', code: '6' }, { name: '闭嘴', code: '7' },
  { name: '睡', code: '8' }, { name: '大哭', code: '9' }, { name: '尴尬', code: '10' }, { name: '发怒', code: '11' },
  { name: '调皮', code: '12' }, { name: '呲牙', code: '13' }, { name: '惊讶', code: '14' }, { name: '难过', code: '15' },
];

// 默认设置
export const DEFAULT_MOMENTS_SETTINGS: MomentsSettings = {
  avatar: '',
  coverImage: '',
  nickname: '我',
  signature: '这个人很懒，什么都没写~',
  content: '九宫格来啦～ [微笑]',
  timeText: '刚刚',
  location: '中国',
  likes: '小明, 小红',
};

interface MomentsPreviewEmbedProps {
  images: ImageData[];
  processedImages?: ProcessedImage[];
  previewImages3D?: string[] | null;
  settings?: MomentsSettings;
  onSettingsChange?: (settings: MomentsSettings) => void;
}

export default function MomentsPreviewEmbed({ 
  images, 
  processedImages, 
  previewImages3D,
  settings: externalSettings,
  onSettingsChange,
}: MomentsPreviewEmbedProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  // 可编辑的数据 - 使用外部设置或默认值
  const [avatar, setAvatar] = useState<string>(externalSettings?.avatar || DEFAULT_MOMENTS_SETTINGS.avatar);
  const [coverImage, setCoverImage] = useState<string>(externalSettings?.coverImage || DEFAULT_MOMENTS_SETTINGS.coverImage);
  const [nickname, setNickname] = useState(externalSettings?.nickname || DEFAULT_MOMENTS_SETTINGS.nickname);
  const [signature, setSignature] = useState(externalSettings?.signature || DEFAULT_MOMENTS_SETTINGS.signature);
  const [content, setContent] = useState(externalSettings?.content || DEFAULT_MOMENTS_SETTINGS.content);
  const [timeText, setTimeText] = useState(externalSettings?.timeText || DEFAULT_MOMENTS_SETTINGS.timeText);
  const [location, setLocation] = useState(externalSettings?.location || DEFAULT_MOMENTS_SETTINGS.location);
  const [likes, setLikes] = useState(externalSettings?.likes || DEFAULT_MOMENTS_SETTINGS.likes);

  // 当外部设置变化时同步
  useEffect(() => {
    if (externalSettings) {
      setAvatar(externalSettings.avatar);
      setCoverImage(externalSettings.coverImage);
      setNickname(externalSettings.nickname);
      setSignature(externalSettings.signature);
      setContent(externalSettings.content);
      setTimeText(externalSettings.timeText);
      setLocation(externalSettings.location);
      setLikes(externalSettings.likes);
    }
  }, [externalSettings]);

  // 通知父组件设置变化
  const notifySettingsChange = useCallback(() => {
    if (onSettingsChange) {
      onSettingsChange({
        avatar,
        coverImage,
        nickname,
        signature,
        content,
        timeText,
        location,
        likes,
      });
    }
  }, [avatar, coverImage, nickname, signature, content, timeText, location, likes, onSettingsChange]);

  // 当设置变化时通知父组件
  useEffect(() => {
    notifySettingsChange();
  }, [notifySettingsChange]);

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAvatar(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 处理封面上传
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setCoverImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 默认封面（渐变背景）
  const defaultCover = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect fill="url(#grad)" width="400" height="200"/>
    </svg>
  `);

  // 默认头像
  const defaultAvatar = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234f46e5" width="100" height="100"/><text x="50" y="65" font-size="40" fill="white" text-anchor="middle">${encodeURIComponent(nickname.charAt(0) || '我')}</text></svg>`;

  // 渲染内容中的表情
  const renderContentWithEmoji = (text: string) => {
    const emojiMap = new Map(WECHAT_EMOJIS.map(e => [e.name, e.code]));
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const emojiName = match[1];
      const emojiCode = emojiMap.get(emojiName);
      if (emojiCode !== undefined) {
        parts.push(
          <img
            key={`${match.index}-${emojiName}`}
            src={`${WECHAT_EMOJI_BASE}${emojiCode}.gif`}
            alt={emojiName}
            className="inline-block w-4 h-4 align-text-bottom mx-0.5"
          />
        );
      } else {
        parts.push(match[0]);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  // 渲染九宫格图片
  const renderGrid = () => {
    // 优先级: 3D预览 > 特效处理后 > 原图
    let dataImages: { fullSize: string; position: number }[];
    
    if (previewImages3D && previewImages3D.length === 9) {
      dataImages = previewImages3D.map((src, i) => ({ fullSize: src, position: i }));
    } else if (processedImages && processedImages.length > 0) {
      dataImages = processedImages.map(img => ({ fullSize: img.processedData, position: img.position }));
    } else {
      dataImages = images.map(img => ({ fullSize: img.fullSize, position: img.position }));
    }

    const count = dataImages.length;
    if (count === 0) return null;

    if (count === 1) {
      return (
        <div className="w-40 h-40 cursor-pointer" onClick={() => setSelectedImage(0)}>
          <img src={dataImages[0].fullSize} alt="" className="w-full h-full object-cover rounded" />
        </div>
      );
    }

    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-1 w-48">
          {dataImages.map((img, idx) => (
            <div key={idx} className="aspect-square cursor-pointer" onClick={() => setSelectedImage(idx)}>
              <img src={img.fullSize} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-1 w-56">
        {dataImages.map((img, idx) => (
          <div key={idx} className="aspect-square cursor-pointer" onClick={() => setSelectedImage(idx)}>
            <img src={img.fullSize} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-1">缩放:</span>
          {[0.8, 1, 1.2].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                scale === s
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {s === 1 ? '1x' : s < 1 ? `${s}x` : `${s}x`}
            </button>
          ))}
        </div>
        
        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
            showSettings ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          设置
        </button>
      </div>

      {/* 右侧滑入设置面板 */}
      <div
        className={`absolute top-0 right-0 h-full w-72 bg-slate-800/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-20 transform transition-transform duration-300 ease-out ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 设置面板头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-white">朋友圈设置</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 设置内容 */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-52px)] custom-scrollbar">
          {/* 封面背景 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">封面背景</label>
            <div className="relative group w-full h-20 rounded-lg overflow-hidden">
              <img src={coverImage || defaultCover} alt="" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>
          </div>

          {/* 头像和昵称 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">头像和昵称</label>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img src={avatar || defaultAvatar} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg cursor-pointer transition-opacity">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="昵称"
                  className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="个性签名"
                  className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* 文案 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">文案内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="说点什么..."
              rows={3}
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500">支持微信表情，如 [微笑] [呲牙]</p>
          </div>

          {/* 位置 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">位置</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="所在位置"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* 时间 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">发布时间</label>
            <input
              type="text"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              placeholder="如：刚刚、5分钟前"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* 点赞 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">点赞列表</label>
            <input
              type="text"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="用逗号分隔，如：小明, 小红"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* 可用表情列表 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">可用表情</label>
            <div className="flex flex-wrap gap-1">
              {WECHAT_EMOJIS.map((emoji) => (
                <button
                  key={emoji.code}
                  onClick={() => setContent(prev => prev + `[${emoji.name}]`)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title={emoji.name}
                >
                  <img
                    src={`${WECHAT_EMOJI_BASE}${emoji.code}.gif`}
                    alt={emoji.name}
                    className="w-5 h-5"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 微信个人主页样式 */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <div 
          className="bg-[#ededed] rounded-xl overflow-hidden shadow-xl w-full max-w-sm origin-center transition-transform relative"
          style={{ transform: `scale(${scale})` }}
        >
          {/* 封面背景区域 */}
          <div className="relative">
            {/* 状态栏 - 压在封面上 */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/40 to-transparent px-4 py-1.5 flex justify-between items-center text-xs text-white">
              <span>12:00</span>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                </svg>
              </div>
            </div>
            
            {/* 背景图 */}
            <div className="h-36 relative overflow-hidden">
              <img 
                src={coverImage || defaultCover} 
                alt="" 
                className="w-full h-full object-cover"
              />
              {/* 换封面按钮 */}
              <div className="absolute bottom-2 right-2 text-white/80 text-xs flex items-center gap-1">
                <span>换封面</span>
              </div>
            </div>

            {/* 头像和昵称区域 - 昵称在背景上 */}
            <div className="absolute -bottom-12 right-3 flex items-end gap-3">
              <div className="text-right mb-14">
                <div className="text-white font-semibold text-base drop-shadow-lg">{nickname}</div>
              </div>
              <img 
                src={avatar || defaultAvatar} 
                alt="" 
                className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-lg"
              />
            </div>
          </div>

          {/* 个人信息区域 */}
          <div className="bg-white pt-14 pb-3 px-4">
            {/* 个性签名 */}
            <div className="text-xs text-gray-500 mb-3">
              {signature}
            </div>

            {/* 朋友圈入口 */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <span className="text-sm text-gray-700">朋友圈</span>
              <div className="flex items-center gap-2">
                {/* 显示前三张图片缩略图 */}
                <div className="flex -space-x-1">
                  {(() => {
                    let dataImages: { fullSize: string }[];
                    if (previewImages3D && previewImages3D.length > 0) {
                      dataImages = previewImages3D.slice(0, 3).map(src => ({ fullSize: src }));
                    } else if (processedImages && processedImages.length > 0) {
                      dataImages = processedImages.slice(0, 3).map(img => ({ fullSize: img.processedData }));
                    } else {
                      dataImages = images.slice(0, 3).map(img => ({ fullSize: img.fullSize }));
                    }
                    return dataImages.map((img, i) => (
                      <img key={i} src={img.fullSize} alt="" className="w-10 h-10 object-cover rounded border border-white" />
                    ));
                  })()}
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="h-2 bg-[#ededed]"></div>

          {/* 朋友圈内容 */}
          <div className="bg-white">
            <div className="flex p-3">
              {/* 头像 */}
              <div className="flex-shrink-0 mr-3">
                <img src={avatar || defaultAvatar} alt="" className="w-10 h-10 rounded object-cover" />
              </div>

              {/* 内容区 */}
              <div className="flex-1 min-w-0">
                <div className="text-[#576b95] font-medium text-sm mb-1">{nickname}</div>
                {content && (
                  <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">
                    {renderContentWithEmoji(content)}
                  </div>
                )}
                <div className="mb-2">{renderGrid()}</div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>{timeText}</span>
                    {location && <span className="text-[#576b95]">{location}</span>}
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 bg-[#f7f7f7] rounded px-2 py-1">
                    <svg className="w-4 h-4 text-[#576b95]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                </div>

                {/* 点赞 */}
                {likes && (
                  <div className="mt-2 bg-[#f7f7f7] rounded px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-1 text-[#576b95]">
                      <span>❤️</span>
                      <span>{likes}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部导航 */}
          <div className="bg-white border-t border-gray-100 px-4 py-2 flex justify-around text-xs text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>微信</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>通讯录</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[#07c160]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              <span>发现</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>我</span>
            </div>
          </div>
        </div>
      </div>


      {/* 大图预览 */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={(
              previewImages3D && previewImages3D.length === 9
                ? previewImages3D[selectedImage]
                : processedImages && processedImages[selectedImage]
                  ? processedImages[selectedImage].processedData
                  : images[selectedImage]?.fullSize
            ) as string}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
