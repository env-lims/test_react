import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

// 1. DB 구조와 완벽히 일치시킨 타입 정의 (암호 포함)
type UserRecord = {
  id: string | number
  이메일: string
  암호: string 
  이름: string | null
  권한: string | null   // DB의 '직책'을 AS로 받아옴
  상태: string | null
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationOne, setOrganizationOne] = useState('')
  const [organizationTwo, setOrganizationTwo] = useState('')
  const [phone, setPhone] = useState('')
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 💡 [변경] 단순 boolean 스위치가 아니라, 로그인한 유저의 정보 자체를 기억하는 상태
  const [user, setUser] = useState<UserRecord | null>(null)
  const [showLimsPage, setShowLimsPage] = useState(false)

  // ⚡ [추천 표준 로직] 브라우저가 처음 켜질 때, 기존에 저장된 세션이 있는지 체크 (새로고침 방지)
  useEffect(() => {
    const savedUser = localStorage.getItem('my_nas_session')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setShowLimsPage(false)
      return
    }

    const timer = window.setTimeout(() => setShowLimsPage(true), 1800)
    return () => window.clearTimeout(timer)
  }, [user])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setMessage('백엔드 연결 설정을 먼저 확인해주세요.')
      return
    }

    setIsLoading(true)
    setMessage('')

    const { data, error } = await supabase.rpc('login_user', {
      login_email: email,
      login_password: password,
    }).maybeSingle<UserRecord>()

    setIsLoading(true) // 로딩 종료 상태 유지를 위해 아래에서 처리

    if (error) {
      setMessage(`로그인할 수 없습니다: ${error.message}`)
      setIsLoading(false)
      return
    }

    if (!data) {
      setMessage('이메일 또는 암호가 올바르지 않습니다.')
      setIsLoading(false)
      return
    }

    if (data.상태 && !['활성', '사용', 'active', 'enabled'].includes(data.상태.toLowerCase())) {
      setMessage('현재 사용할 수 없는 계정입니다.')
      setIsLoading(false)
      return
    }

    // 🔒 보안 팁: 메모리 및 로컬스토리지 저장 전, 민감한 '암호' 데이터는 제외하고 저장하는 것이 정석입니다.
    const { 암호, ...safeUserData } = data

    // 💡 [변경] 로그인 성공 시 브라우저 미니 저장소와 리액트 메모리에 동시에 저장
    setUser(safeUserData as UserRecord)
    if (remember) {
      // '로그인 상태 유지' 체크 시 로컬스토리지에 저장 (창을 닫아도 유지)
      localStorage.setItem('my_nas_session', JSON.stringify(safeUserData))
    } else {
      // 체크 안 했을 시 세션스토리지에 저장 (창 닫으면 로그아웃)
      sessionStorage.setItem('my_nas_session', JSON.stringify(safeUserData))
    }

    setMessage(`${data.이름 || data.이메일}님, 로그인되었습니다. (${data.권한 || '사용자'})`)
    setIsLoading(false)
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setMessage('백엔드 연결 설정을 먼저 확인해주세요.')
      return
    }

    if (!email || !password || !name || !organizationOne || !organizationTwo) {
      setMessage('회원가입에 필요한 항목을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.rpc('register_user', {
      new_email: email,
      new_password: password,
      new_name: name,
      new_org1: organizationOne,
      new_org2: organizationTwo,
      new_phone: phone || null,
    })
    setIsLoading(false)
    setMessage(error ? `회원가입할 수 없습니다: ${error.message}` : '회원가입이 완료되었습니다.')
    if (!error) {
      setIsSignUpMode(false)
    }
  }

  const handlePasswordReset = async () => {
    setMessage('암호 재설정은 관리자에게 요청해주세요.')
  }

  const handleLogout = () => {
    // 💡 [변경] 모든 저장소와 메모리 상태를 비우고 로그인 폼 초기화
    setUser(null)
    localStorage.removeItem('my_nas_session')
    sessionStorage.removeItem('my_nas_session')
    setEmail('')
    setPassword('')
    setMessage('')
  }

  if (showLimsPage) {
    return (
      <main className="lims-page">
        <div className="lims-toolbar">
          <span>환경정보 LIMS</span>
          <button className="btn-logout" type="button" onClick={handleLogout}>로그아웃</button>
        </div>
        <iframe
          className="lims-frame"
          src="/lims_reception.html"
          title="LIMS 접수 화면"
        />
      </main>
    )
  }

  // 💡 유저 정보가 존재하는가에 따라 화면 렌더링 결정
  const isLoggedIn = !!user

  return (
    <main className="login-page">
      <div className="bg-deco deco-1" aria-hidden="true">📂</div>
      <div className="bg-deco deco-2" aria-hidden="true">📄</div>
      <div className="bg-deco deco-3" aria-hidden="true">📁</div>
      <div className="bg-deco deco-4" aria-hidden="true">💾</div>

      <div className="login-wrapper">
        <div className="folder-tab" aria-hidden="true">root/login</div>
        <section className="login-card" aria-labelledby="login-title">
          <div className={`success-overlay${isLoggedIn ? ' active' : ''}`}>
            <div className="success-icon" aria-hidden="true">🎉</div>
            <h2 className="success-title">환영합니다!</h2>
            {/* 💡 [변경] 이제 로그인된 실제 유저의 이름과 권한(직책)을 화면에 동적으로 띄울 수 있습니다. */}
            <p className="success-desc">
              <strong>{user?.이름 || user?.이메일}</strong>({user?.권한})님, <br />
              OMV7 파일브라우저 시스템에 정상적으로 연결되었습니다.
            </p>
            <button className="btn-logout" type="button" onClick={handleLogout}>로그아웃(돌아가기)</button>
          </div>

          <header className="card-header">
            <div className="window-controls" aria-hidden="true"><span className="control-dot dot-red" /><span className="control-dot dot-yellow" /><span className="control-dot dot-green" /></div>
            <div className="logo-container" aria-hidden="true">📂</div>
            <h1 id="login-title" className="brand-name">OMV7 CuteNAS</h1>
            <p className="brand-subtitle">귀여운 간이 파일 브라우저 시스템</p>
          </header>

          <div className="card-body">
            <form onSubmit={isSignUpMode ? handleSignUp : handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">이메일</label>
                <div className="input-wrapper"><span className="input-icon" aria-hidden="true">👤</span><input className="form-input" id="email" name="email" type="email" placeholder="이메일을 입력하세요" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
              </div>

              {isSignUpMode && <>
                <div className="form-group"><label className="form-label" htmlFor="name">이름</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">🪪</span><input className="form-input" id="name" name="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required /></div></div>
                <div className="form-group"><label className="form-label" htmlFor="organization-one">소속1</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">🏢</span><input className="form-input" id="organization-one" name="organization-one" type="text" value={organizationOne} onChange={(event) => setOrganizationOne(event.target.value)} required /></div></div>
                <div className="form-group"><label className="form-label" htmlFor="organization-two">소속2</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">📌</span><input className="form-input" id="organization-two" name="organization-two" type="text" value={organizationTwo} onChange={(event) => setOrganizationTwo(event.target.value)} required /></div></div>
                <div className="form-group"><label className="form-label" htmlFor="phone">전화번호 (선택)</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">📞</span><input className="form-input" id="phone" name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div></div>
              </>}

              <div className="form-group">
                <label className="form-label" htmlFor="password">비밀번호</label>
                <div className="input-wrapper"><span className="input-icon" aria-hidden="true">🔒</span><input className="form-input" id="password" name="password" type="password" placeholder="비밀번호를 입력하세요" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              </div>

              {!isSignUpMode && <div className="form-options"><label className="remember-me"><input type="checkbox" name="remember" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> 로그인 상태 유지</label><button type="button" className="forgot-link" onClick={handlePasswordReset}>비밀번호 찾기</button></div>}
              <button className="btn-submit" type="submit" disabled={isLoading}>{isLoading ? '연결 중...' : isSignUpMode ? '회원가입' : '파일 브라우저 열기'} <span aria-hidden="true">⚡</span></button>
              <p className={`status-message${message ? ' visible' : ''}`} aria-live="polite">{message}</p>
            </form>
          </div>

          <footer className="card-footer"><span>Version 7.0.4-cute</span><button type="button" className="footer-link" onClick={() => setIsSignUpMode((current) => !current)}>{isSignUpMode ? '로그인으로 돌아가기' : '회원가입'}</button></footer>
        </section>
      </div>
    </main>
  )
}

export default App