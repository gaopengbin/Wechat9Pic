/**
 * MomentsPreview - 微信朋友圈预览组件
 * 模拟朋友圈的 UI 展示效果
 */

import { useState } from 'react';
import type { ImageData } from '@/types';

interface MomentsPreviewProps {
  images: ImageData[];
  onClose: () => void;
}

// 微信同款表情 - 使用微信表情 CDN
const WECHAT_EMOJI_BASE = 'https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/';
const WECHAT_EMOJIS: { name: string; code: string }[] = [
  { name: '微笑', code: '0' }, { name: '撇嘴', code: '1' }, { name: '色', code: '2' }, { name: '发呆', code: '3' },
  { name: '得意', code: '4' }, { name: '流泪', code: '5' }, { name: '害羞', code: '6' }, { name: '闭嘴', code: '7' },
  { name: '睡', code: '8' }, { name: '大哭', code: '9' }, { name: '尴尬', code: '10' }, { name: '发怒', code: '11' },
  { name: '调皮', code: '12' }, { name: '呲牙', code: '13' }, { name: '惊讶', code: '14' }, { name: '难过', code: '15' },
  { name: '囧', code: '16' }, { name: '抓狂', code: '17' }, { name: '吐', code: '18' }, { name: '偷笑', code: '19' },
  { name: '愉快', code: '20' }, { name: '白眼', code: '21' }, { name: '傲慢', code: '22' }, { name: '困', code: '23' },
  { name: '惊恐', code: '24' }, { name: '憨笑', code: '25' }, { name: '悠闲', code: '26' }, { name: '咒骂', code: '27' },
  { name: '疑问', code: '28' }, { name: '嘘', code: '29' }, { name: '晕', code: '30' }, { name: '衰', code: '31' },
  { name: '骷髅', code: '32' }, { name: '敲打', code: '33' }, { name: '再见', code: '34' }, { name: '擦汗', code: '35' },
  { name: '抠鼻', code: '36' }, { name: '鼓掌', code: '37' }, { name: '坏笑', code: '38' }, { name: '左哼哼', code: '39' },
  { name: '右哼哼', code: '40' }, { name: '哈欠', code: '41' }, { name: '鄙视', code: '42' }, { name: '委屈', code: '43' },
  { name: '快哭了', code: '44' }, { name: '阴险', code: '45' }, { name: '亲亲', code: '46' }, { name: '可怜', code: '47' },
  { name: '笑脸', code: '48' }, { name: '生病', code: '49' }, { name: '脸红', code: '50' }, { name: '破涕为笑', code: '51' },
  { name: '恐惧', code: '52' }, { name: '失望', code: '53' }, { name: '无语', code: '54' }, { name: '嘿', code: '55' },
  { name: '捂脸', code: '56' }, { name: '奸笑', code: '57' }, { name: '机智', code: '58' }, { name: '皮笑', code: '59' },
  { name: '好的', code: '60' }, { name: '加油', code: '61' }, { name: '汗', code: '62' }, { name: '天啊', code: '63' },
  { name: 'Emm', code: '64' }, { name: '社会社会', code: '65' }, { name: '旺柴', code: '66' }, { name: '好的', code: '67' },
  { name: '打脸', code: '68' }, { name: '加油', code: '69' }, { name: '嘿哈', code: '70' }, { name: '我想想', code: '71' },
  // 手势
  { name: '强', code: '72' }, { name: '抳', code: '73' }, { name: 'OK', code: '74' }, { name: '拱手', code: '75' },
  { name: '拳头', code: '76' }, { name: '勾引', code: '77' }, { name: '拳头', code: '78' }, { name: '差劲', code: '79' },
  { name: '爱你', code: '80' }, { name: 'NO', code: '81' }, { name: '抱拳', code: '82' },
  // 符号
  { name: '爱心', code: '83' }, { name: '心碎', code: '84' }, { name: '太阳', code: '85' }, { name: '月亮', code: '86' },
  { name: '赞', code: '87' }, { name: '握手', code: '88' }, { name: '胜利', code: '89' },
];

// 备用的 Unicode emoji（当微信 CDN 不可用时）
const FALLBACK_EMOJIS = [
  '😄', '😊', '😍', '😳', '😂', '😢', '😊', '🤐',
  '😴', '😭', '😅', '😠', '😜', '😁', '😲', '😞',
  '😱', '😩', '🤮', '😏', '😊', '🙄', '😏', '😪',
  '😨', '😄', '😌', '🤬', '❓', '🤫', '😵', '😥',
  '💀', '👊', '👋', '😓', '👃', '👏', '😈', '😤',
  '😤', '🥱', '😒', '😣', '🥺', '😈', '😘', '🥺',
  '🙂', '🤒', '😳', '😂', '😨', '😞', '😶', '👋',
  '🤦', '😏', '🧐', '😝', '👌', '💪', '😅', '😱',
  '🤔', '🤝', '🐶', '👌', '👋', '💪', '😄', '🤔',
  '👍', '👎', '👌', '🙏', '✊', '🤞', '✊', '👎',
  '🤟', '🚫', '🤜', '❤️', '💔', '☀️', '🌙', '👍', '🤝', '✌️',
];

export default function MomentsPreview({ images, onClose }: MomentsPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [phoneWidth, setPhoneWidth] = useState(375);
  const [isResizing, setIsResizing] = useState(false);
  const [useWechatEmoji, setUseWechatEmoji] = useState(true);
  const [scale, setScale] = useState(1);
  
  // 可编辑的配置
  const [avatar, setAvatar] = useState<string>('');
  const [nickname, setNickname] = useState('我');
  const [content, setContent] = useState('九宫格来啦～ ✨');
  const [location, setLocation] = useState('中国');
  const [timeText, setTimeText] = useState('刚刚');
  
  // 点赞和评论
  const [likes, setLikes] = useState('小明, 小红, 小刚');
  const [comments, setComments] = useState<{name: string; text: string}[]>([
    { name: '小明', text: '好看！' },
    { name: '小红', text: '在哪拍的呀' },
  ]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  // 添加评论
  const addComment = () => {
    if (newCommentName.trim() && newCommentText.trim()) {
      setComments([...comments, { name: newCommentName.trim(), text: newCommentText.trim() }]);
      setNewCommentName('');
      setNewCommentText('');
    }
  };
  
  // 删除评论
  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };
  
  // 插入表情
  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
  };
  
  // 将文本中的 [表情名] 转换为微信表情图片
  const renderContentWithEmoji = (text: string) => {
    const emojiMap = new Map(WECHAT_EMOJIS.map(e => [e.name, e.code]));
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // 添加表情前的文本
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      const emojiName = match[1];
      const emojiCode = emojiMap.get(emojiName);
      
      if (emojiCode !== undefined) {
        // 找到微信表情，渲染图片
        parts.push(
          <img
            key={`${match.index}-${emojiName}`}
            src={`${WECHAT_EMOJI_BASE}${emojiCode}.gif`}
            alt={emojiName}
            className="inline-block w-5 h-5 align-text-bottom mx-0.5"
          />
        );
      } else {
        // 未找到，保留原文本
        parts.push(match[0]);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  // 处理拖拽调整宽度
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = phoneWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(320, Math.min(500, startWidth + deltaX * 2));
      setPhoneWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 默认头像
  const defaultAvatar = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234f46e5" width="100" height="100"/><text x="50" y="65" font-size="40" fill="white" text-anchor="middle">${encodeURIComponent(nickname.charAt(0) || '我')}</text></svg>`;
  
  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 点赞动画
  const handleLike = () => {
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 300);
  };

  // 渲染九宫格图片
  const renderGrid = () => {
    const count = images.length;
    
    if (count === 0) return null;

    // 单张图片
    if (count === 1) {
      return (
        <div 
          className="w-48 h-48 cursor-pointer"
          onClick={() => setSelectedImage(0)}
        >
          <img
            src={images[0].fullSize}
            alt=""
            className="w-full h-full object-cover rounded"
          />
        </div>
      );
    }

    // 4张图片 2x2
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-0.5 w-52">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="aspect-square cursor-pointer"
              onClick={() => setSelectedImage(idx)}
            >
              <img
                src={img.fullSize}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    }

    // 其他情况 3列布局
    return (
      <div className="grid grid-cols-3 gap-0.5 w-60">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="aspect-square cursor-pointer"
            onClick={() => setSelectedImage(idx)}
          >
            <img
              src={img.fullSize}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 设置按钮 */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 left-4 text-white/60 hover:text-white z-10 flex items-center gap-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm">设置</span>
      </button>

      {/* 标题和缩放控制 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-medium flex items-center gap-4">
        <span>朋友圈预览</span>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
          <span className="text-xs text-gray-400">缩放:</span>
          {[1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                scale === s
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">({Math.round(phoneWidth * scale)}px)</span>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute left-4 top-16 bg-gray-800 rounded-xl p-4 w-72 z-20 shadow-2xl border border-white/10">
          <h3 className="text-white font-medium mb-4">预览设置</h3>
          
          {/* 头像 */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-1 block">头像</label>
            <div className="flex items-center gap-3">
              <img
                src={avatar || defaultAvatar}
                alt="avatar"
                className="w-12 h-12 rounded object-cover"
              />
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <span className="block text-center py-1.5 px-3 bg-white/10 text-white text-sm rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  更换头像
                </span>
              </label>
              {avatar && (
                <button
                  onClick={() => setAvatar('')}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  重置
                </button>
              )}
            </div>
          </div>
          
          {/* 昵称 */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入昵称"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* 文案 */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">文案</label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="说点什么..."
                rows={2}
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 bottom-2 text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 12 8 12zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 5.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </button>
            </div>
            
            {/* 表情选择器 */}
            {showEmojiPicker && (
              <div className="mt-2 bg-gray-700 rounded-lg p-2">
                {/* 切换按钮 */}
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => setUseWechatEmoji(!useWechatEmoji)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {useWechatEmoji ? '切换到 Emoji' : '切换到微信'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1">
                    {useWechatEmoji ? (
                      WECHAT_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => insertEmoji(`[${emoji.name}]`)}
                          title={emoji.name}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
                        >
                          <img
                            src={`${WECHAT_EMOJI_BASE}${emoji.code}.gif`}
                            alt={emoji.name}
                            className="w-5 h-5"
                            onError={(e) => {
                              // 回退到 unicode emoji
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.textContent = FALLBACK_EMOJIS[idx] || '😊';
                            }}
                          />
                        </button>
                      ))
                    ) : (
                      FALLBACK_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 位置 */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">位置</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="输入位置"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* 时间 */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">时间</label>
            <input
              type="text"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              placeholder="如：刚刚、1小时前"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* 点赞 */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">点赞（用逗号分隔）</label>
            <input
              type="text"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="小明, 小红, 小刚"
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* 评论列表 */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">评论</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {comments.map((comment, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/5 rounded px-2 py-1">
                  <span className="text-purple-400 text-xs">{comment.name}:</span>
                  <span className="text-white text-xs flex-1 truncate">{comment.text}</span>
                  <button
                    onClick={() => removeComment(idx)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {/* 添加评论 */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
                placeholder="昵称"
                className="w-16 bg-white/10 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-purple-500"
              />
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="评论内容"
                className="flex-1 bg-white/10 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
              />
              <button
                onClick={addComment}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
              >
                +
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(false)}
            className="w-full mt-2 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            完成
          </button>
        </div>
      )}

      {/* 朋友圈卡片 - 可调整宽度和缩放 */}
      <div 
        className="mx-4 relative origin-center transition-transform duration-200"
        style={{ 
          width: phoneWidth,
          transform: `scale(${scale})`,
        }}
      >
        {/* 左侧调整手柄 */}
        <div
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-16 bg-white/20 hover:bg-white/40 rounded-full cursor-ew-resize transition-colors"
          onMouseDown={handleResizeStart}
        />
        {/* 右侧调整手柄 */}
        <div
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-16 bg-white/20 hover:bg-white/40 rounded-full cursor-ew-resize transition-colors"
          onMouseDown={handleResizeStart}
        />
        {/* 模拟微信朋友圈界面 */}
        <div className="bg-[#ededed] rounded-lg overflow-hidden shadow-2xl">
          {/* 状态栏 */}
          <div className="bg-[#ededed] px-4 py-2 flex justify-between items-center text-xs text-gray-600">
            <span>12:00</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14z"/>
              </svg>
            </div>
          </div>

          {/* 朋友圈内容区 */}
          <div className="bg-white">
            {/* 单条朋友圈 */}
            <div className="flex p-3 border-b border-gray-100">
              {/* 头像 */}
              <div className="flex-shrink-0 mr-3">
                <img
                  src={avatar || defaultAvatar}
                  alt="avatar"
                  className="w-10 h-10 rounded object-cover"
                />
              </div>

              {/* 内容区 */}
              <div className="flex-1 min-w-0">
                {/* 昵称 */}
                <div className="text-[#576b95] font-medium text-sm mb-1">
                  {nickname || '我'}
                </div>

                {/* 文字内容 */}
                {content && (
                  <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">
                    {renderContentWithEmoji(content)}
                  </div>
                )}

                {/* 图片网格 */}
                <div className="mb-2">
                  {renderGrid()}
                </div>

                {/* 时间和位置 */}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                  <div className="flex items-center gap-2">
                    <span>{timeText}</span>
                    {location && (
                      <span className="text-[#576b95]">{location}</span>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <button
                    onClick={handleLike}
                    className="px-2 py-1 bg-[#f7f7f7] rounded flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle cx="6" cy="12" r="1.5" fill="#576b95"/>
                      <circle cx="12" cy="12" r="1.5" fill="#576b95"/>
                    </svg>
                  </button>
                </div>

                {/* 点赞和评论区 */}
                {(likes.trim() || comments.length > 0) && (
                  <div className={`mt-2 bg-[#f7f7f7] rounded text-xs transition-all ${likeAnimation ? 'scale-105' : ''}`}>
                    {/* 点赞 */}
                    {likes.trim() && (
                      <div className="px-2 py-1.5 flex items-center gap-1 text-[#576b95]">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>{likes}</span>
                      </div>
                    )}
                    
                    {/* 分割线 */}
                    {likes.trim() && comments.length > 0 && (
                      <div className="border-t border-gray-200 mx-2"></div>
                    )}
                    
                    {/* 评论 */}
                    {comments.length > 0 && (
                      <div className="px-2 py-1.5">
                        {comments.map((comment, idx) => (
                          <p key={idx} className="text-gray-800">
                            <span className="text-[#576b95]">{comment.name}：</span>
                            {comment.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部输入框 */}
          <div className="bg-[#f7f7f7] px-3 py-2 flex items-center gap-2 border-t border-gray-200">
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-sm text-gray-400">
              评论
            </div>
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* 提示 */}
        <p className="text-center text-gray-400 text-xs mt-4">
          点击图片可查看大图
        </p>
      </div>

      {/* 大图预览 */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black z-60 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={images[selectedImage]?.fullSize || images[selectedImage]?.thumbnail}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          
          {/* 图片索引 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage + 1} / {images.length}
          </div>

          {/* 左右切换 */}
          {selectedImage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {selectedImage < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
