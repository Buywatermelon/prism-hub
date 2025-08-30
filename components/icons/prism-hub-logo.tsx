import React from "react"

interface PrismHubLogoProps {
  className?: string
  showText?: boolean
}

export function PrismHubLogo({ className = "w-8 h-8", showText = false }: PrismHubLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(24, 24)">
        {/* 前面的棱镜面 */}
        <path
          d="M0 -16L14 0L0 12L-14 0L0 -16Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* 后面的顶点和边（立体效果） */}
        <path
          d="M0 -16L8 -8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        
        {/* 后面的垂直边 */}
        <path
          d="M8 -8L8 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 3"
          opacity="0.3"
        />
        
        {/* 后面的底边 */}
        <path
          d="M8 8L0 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        
        {/* 后面的侧边 */}
        <path
          d="M8 -8L14 0M8 8L14 0"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 3"
          opacity="0.3"
        />
        
        {/* 中心垂直线 */}
        <path
          d="M0 -16L0 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

