// components/auth/AuthLayout/FloatingElements.tsx - Versão com inline styles
import React from 'react';
import { 
  FaGamepad, 
  FaTrophy, 
  FaChartLine, 
  FaHeart,
  FaUsers, 
  FaStethoscope,
  FaBrain,
  FaHandshake 
} from 'react-icons/fa';

interface FloatingElementsProps {
  userType: 'student' | 'professional';
}

export default function FloatingElements({ userType }: FloatingElementsProps) {
  const isStudent = userType === 'student';
  
  const studentElements = [
    { 
      icon: FaGamepad, 
      position: 'top-[10%] left-[5%]', 
      delay: '0s',
      size: 32 
    },
    { 
      icon: FaTrophy, 
      position: 'top-[20%] right-[8%]', 
      delay: '1s',
      size: 32 
    },
    { 
      icon: FaChartLine, 
      position: 'bottom-[15%] left-[10%]', 
      delay: '2s',
      size: 32 
    },
    { 
      icon: FaHeart, 
      position: 'bottom-[25%] right-[12%]', 
      delay: '3s',
      size: 32 
    },
  ];
  
  const professionalElements = [
    { 
      icon: FaUsers, 
      position: 'top-[10%] left-[5%]', 
      delay: '0s',
      size: 32 
    },
    { 
      icon: FaStethoscope, 
      position: 'top-[20%] right-[8%]', 
      delay: '1s',
      size: 32 
    },
    { 
      icon: FaBrain, 
      position: 'bottom-[15%] left-[12%]', 
      delay: '2s',
      size: 32 
    },
    { 
      icon: FaHandshake, 
      position: 'bottom-[25%] right-[10%]', 
      delay: '3s',
      size: 32 
    },
  ];
  
  const elements = isStudent ? studentElements : professionalElements;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {elements.map((element, index) => {
        const Icon = element.icon;
        return (
          <div
            key={index}
            className={`absolute ${element.position} opacity-10`}
            style={{
              animation: `float 6s ease-in-out infinite ${element.delay}`
            }}
          >
            <Icon 
              size={element.size} 
              className="text-white"
            />
          </div>
        );
      })}

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }
      `}</style>
    </div>
  );
}