import React, { useState } from 'react';
import { School } from '../types';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSchool: School;
  onShowToast: (msg: string) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  activeSchool,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<{ sender: 'agent' | 'user'; text: string; time: string }[]>([
    {
      sender: 'agent',
      text: `Hello! I'm Sneha from Magnum Institutional Helpdesk for ${activeSchool.name}. How can I assist you with your uniform orders or sizing today?`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const quickQuestions = [
    'How do I exchange my size?',
    'What is the blazer requirement for Grade 6?',
    'When will my order #MGN-84920 be delivered?',
    'Can I pick up uniform from school counter?',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = { sender: 'user' as const, text, time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      let reply = `Thank you for reaching out! Regarding "${text}": `;
      if (text.toLowerCase().includes('exchange') || text.toLowerCase().includes('size')) {
        reply += `You can request an instant 7-day size swap right under Track Order. Our courier will deliver the new size and collect the old one with zero courier charge!`;
      } else if (text.toLowerCase().includes('blazer')) {
        reply += `Delhi Public School, Pune mandates the Navy Crested Blazer from October 15th through February for all students from Grade 5 upwards.`;
      } else if (text.toLowerCase().includes('deliver') || text.toLowerCase().includes('mgn')) {
        reply += `Your consignment #MGN-84920 has passed institutional quality QA and is dispatched with BlueDart Express for delivery by 14 May.`;
      } else {
        reply += `Our authorized school coordinator at ${activeSchool.name} desk has noted your request. We have also forwarded a copy to your registered WhatsApp (+91 98201 49201).`;
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'agent' as const, text: reply, time: 'Just now' },
      ]);
    }, 600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-2xl max-w-md w-full h-[580px] flex flex-col shadow-2xl border border-surface-container overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-primary text-on-primary flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center font-bold text-base shadow-xs">
                M
              </div>
              <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-primary absolute bottom-0 right-0"></span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold leading-tight">
                Magnum Support Desk
              </h3>
              <p className="text-[11px] text-secondary-fixed">
                Authorized for {activeSchool.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onShowToast('Connecting to WhatsApp Coordinator (+91 98201 49201)...');
              }}
              className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary hover:bg-white/20 transition-colors"
              title="Open WhatsApp"
            >
              <span className="material-symbols-outlined text-base">chat</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary hover:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Coordinator Info Banner */}
        <div className="px-4 py-2 bg-secondary-container/20 border-b border-secondary/20 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-primary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-secondary">verified</span>
            Direct Campus Helpline: +91 98201 49201
          </span>
          <span className="text-secondary font-bold">Mon-Sat: 9am-6pm</span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-container-low/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-primary text-on-primary rounded-br-xs'
                    : 'bg-surface-container-lowest text-on-surface border border-surface-container rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-outline mt-0.5 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Question Chips */}
        <div className="px-3 py-2 bg-surface-container-lowest border-t border-surface-container overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[10px] font-semibold text-primary bg-surface-container-low hover:bg-surface-container px-2.5 py-1.5 rounded-full whitespace-nowrap border border-surface-container transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-surface-container-lowest border-t border-surface-container flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type your question or query..."
            className="flex-1 h-11 px-3 bg-surface-container-low rounded-xl text-[13px] text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <button
            onClick={() => handleSendMessage()}
            className="w-11 h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-lg text-secondary-fixed">
              send
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
