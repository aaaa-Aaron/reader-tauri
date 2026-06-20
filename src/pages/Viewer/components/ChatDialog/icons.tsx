import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// 书籍 AI 图标
export const BookAI: React.FC<IconProps> = ({ className, style }) => {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      fill="currentColor"
    >
      <path d="M842 272H604V168c0-44.4-36-80-80-80H272c-44.4 0-80 35.6-80 80v688c0 44.4 35.6 80 80 80h372c26.8 0 50.8-13.2 66-34.8l8.4-11.8c12.8-18 20-40.4 20-64V352c0-44.4-35.6-80-80-80z m-80 536c0 22-18 40-40 40H272c-22 0-40-18-40-40V168c0-22 18-40 40-40h172c22 0 40 18 40 40v640z" />
      <path d="M672 512c-16 0-32 16-32 32v96c0 16 16 32 32 32s32-16 32-32v-96c0-16-16-32-32-32z m0 192c-17.6 0-32-14.4-32-32v-32c0-17.6 14.4-32 32-32s32 14.4 32 32v32c0 17.6-14.4 32-32 32z" />
      <path d="M864 512h-96c-17.6 0-32 14.4-32 32v96c0 17.6 14.4 32 32 32h96c17.6 0 32-14.4 32-32v-96c0-17.6-14.4-32-32-32z m0 128h-96v-96h96v96z" />
      <path d="M864 384h-96c-17.6 0-32 14.4-32 32v32c0 17.6 14.4 32 32 32h96c17.6 0 32-14.4 32-32v-32c0-17.6-14.4-32-32-32z m0 64h-96v-32h96v32z" />
    </svg>
  );
};
