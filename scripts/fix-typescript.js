#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 TypeScript Fix Script for Christians on Campus App');
console.log('====================================================\n');

// 检查当前错误
console.log('📋 Step 1: Analyzing TypeScript errors...');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  const output = stderr || stdout;
  
  if (error) {
    console.log('❌ Found TypeScript errors:\n');
    
    // 分析常见错误模式
    const errors = output.split('\n').filter(line => line.includes('error TS'));
    const errorTypes = {};
    
    errors.forEach(error => {
      if (error.includes('TS2304')) errorTypes['TS2304'] = (errorTypes['TS2304'] || 0) + 1;
      if (error.includes('TS2322')) errorTypes['TS2322'] = (errorTypes['TS2322'] || 0) + 1;
      if (error.includes('TS2339')) errorTypes['TS2339'] = (errorTypes['TS2339'] || 0) + 1;
      if (error.includes('TS2571')) errorTypes['TS2571'] = (errorTypes['TS2571'] || 0) + 1;
      if (error.includes('TS7053')) errorTypes['TS7053'] = (errorTypes['TS7053'] || 0) + 1;
    });
    
    console.log('📊 Error Summary:');
    console.log('================');
    Object.entries(errorTypes).forEach(([code, count]) => {
      const description = getErrorDescription(code);
      console.log(`   ${code}: ${count} errors - ${description}`);
    });
    
    console.log('\n🔧 Recommended Actions:');
    console.log('======================');
    
    // 提供具体的修复建议
    if (errorTypes['TS2304']) {
      console.log('   • Missing imports/types: Check import statements and install missing @types packages');
    }
    
    if (errorTypes['TS2339']) {
      console.log('   • Property issues: Use optional chaining (?.) or add proper type definitions');
    }
    
    if (errorTypes['TS7053']) {
      console.log('   • Index signature: Add [key: string]: any to object types');
    }
    
    if (errorTypes['TS2322']) {
      console.log('   • Type mismatches: Check prop types and component interfaces');
    }
    
    console.log('\n📝 Full error details: npx tsc --noEmit');
    console.log('🚀 Start with checking: npm run start:check');
    
    // 显示前10个错误的详情
    console.log('\n🔍 First 10 errors:');
    console.log('===================');
    const errorLines = output.split('\n').slice(0, 20);
    errorLines.forEach(line => {
      if (line.trim()) console.log(line);
    });
    
  } else {
    console.log('✅ No TypeScript errors found! 🎉');
    console.log('Your project is type-safe and ready to go!\n');
    console.log('You can now use:');
    console.log('  npm run start:check - Start with type checking');
    console.log('  npm run type-check - Manual type checking');
  }
});

function getErrorDescription(code) {
  const descriptions = {
    'TS2304': 'Cannot find name/type (missing imports)',
    'TS2322': 'Type assignment mismatch', 
    'TS2339': 'Property does not exist on type',
    'TS2571': 'Object is possibly null/undefined',
    'TS7053': 'Element implicitly has any type',
    'TS2345': 'Argument type mismatch',
    'TS2540': 'Cannot assign to readonly property',
    'TS2551': 'Property does not exist (possible typo)',
  };
  return descriptions[code] || 'Unknown error type';
}

// 检查并创建类型声明文件
const typeDefsPath = path.join(process.cwd(), 'types');
if (!fs.existsSync(typeDefsPath)) {
  console.log('\n📁 Creating types directory...');
  fs.mkdirSync(typeDefsPath, { recursive: true });
  
  // 创建全局类型声明
  const globalTypes = `// Global type definitions for Christians on Campus App
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

// Global types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
  interface Window {
    fs?: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    };
  }
}

export {};`;

  fs.writeFileSync(path.join(typeDefsPath, 'global.d.ts'), globalTypes);
  console.log('✅ Created types/global.d.ts');
}

console.log('\n🎯 Available Commands:');
console.log('=====================');
console.log('   npm run type-check          - Check all TypeScript errors');  
console.log('   npm run type-check:watch    - Watch for TypeScript errors');
console.log('   npm run start:check         - Start with type checking');
console.log('   npm run android:check       - Android with type checking');
console.log('   npm run ios:check           - iOS with type checking');
console.log('   npm run fix-types           - Run this analysis script\n');