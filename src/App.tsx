import { useEffect, useRef, useState } from 'react'
import { lazy, Suspense } from 'react'
import type { FormEvent } from 'react'
import type { MutableRefObject } from 'react'
import galleryData from '../gallery.json'
import { siteConfig, whatsappUrl } from './site.config'

type Photo = { src: string; alt: string; width: number; height: number }
type Category = { id: string; title: string; description: string; aspect: string; images: Photo[] }
const categories = galleryData.categories as Category[]
const LazyHeroScene = lazy(() => import('./HeroScene'))
const imagePath = (file: string) => `${import.meta.env.BASE_URL}img/${file}`
const imageCandidates = (photo: Photo, format: 'avif' | 'webp') => [480, 800, 1200]
  .filter((width) => width < photo.width)
  .map((width) => `${import.meta.env.BASE_URL}img/optimized/${photo.src.replace(/\.jpg$/i, '')}-${width}.${format} ${width}w`)
  .join(', ')

function ResponsiveImage({ photo, className = '', loading = 'lazy', sizes = '(max-width: 760px) 45vw, 25vw' }: { photo: Photo; className?: string; loading?: 'lazy' | 'eager'; sizes?: string }) {
  const avif = imageCandidates(photo, 'avif')
  const webp = imageCandidates(photo, 'webp')
  return <picture>
    {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
    {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
    <img className={className} src={imagePath(photo.src)} alt={photo.alt} width={photo.width} height={photo.height} loading={loading} decoding="async" />
  </picture>
}

function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (String(data.get('website') || '').trim()) return
    const next: Record<string, string> = {}
    for (const field of ['name', 'phone', 'email', 'project', 'message']) {
      if (!String(data.get(field) || '').trim()) next[field] = 'Este campo es obligatorio.'
    }
    if (data.get('email') && !/^\S+@\S+\.\S+$/.test(String(data.get('email')))) next.email = 'Escriba un correo válido.'
    if (!data.get('privacy')) next.privacy = 'Necesitamos su consentimiento para continuar.'
    setErrors(next)
    setStatus('')
    if (Object.keys(next).length) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (!siteConfig.formAction) {
      const subject = encodeURIComponent(`Consulta sobre ${String(data.get('project'))}`)
      const body = encodeURIComponent(`Nombre: ${data.get('name')}\nTeléfono: ${data.get('phone')}\nCorreo: ${data.get('email')}\nProyecto: ${data.get('project')}\n\n${data.get('message')}`)
      window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${body}`
      setStatus('Se preparó su mensaje en la aplicación de correo. Si no se abrió, escriba a peiarq@gmail.com.')
      return
    }
    try {
      const response = await fetch(siteConfig.formAction, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('No fue posible enviar el mensaje.')
      form.reset()
      setStatus('Gracias por escribirnos. Su mensaje fue enviado.')
    } catch {
      setStatus('No se pudo enviar el mensaje. Intente de nuevo o escríbanos por correo o WhatsApp.')
    }
  }

  const fieldError = (name: string) => errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name]}</span>
  const invalid = (name: string) => errors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` } : {}

  return <form className="contact-form" onSubmit={handleSubmit} noValidate>
    <div className="form-row">
      <label>Nombre<input name="name" autoComplete="name" {...invalid('name')} />{fieldError('name')}</label>
      <label>Teléfono<input name="phone" type="tel" autoComplete="tel" {...invalid('phone')} />{fieldError('phone')}</label>
    </div>
    <div className="form-row">
      <label>Correo electrónico<input name="email" type="email" autoComplete="email" {...invalid('email')} />{fieldError('email')}</label>
      <label>Tipo de proyecto<select name="project" defaultValue="" {...invalid('project')}><option value="" disabled>Seleccione una categoría</option>{categories.map((category) => <option key={category.id}>{category.title}</option>)}</select>{fieldError('project')}</label>
    </div>
    <label>Cuéntenos sobre su proyecto<textarea name="message" rows={4} {...invalid('message')} />{fieldError('message')}</label>
    <label className="honeypot" aria-hidden="true">Deje este campo vacío<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <label className="consent"><input type="checkbox" name="privacy" {...invalid('privacy')} /><span>Acepto que mis datos se usen para responder a esta consulta.{siteConfig.privacyNoticeUrl && <> <a href={siteConfig.privacyNoticeUrl}>Leer aviso de privacidad</a></>}</span></label>
    {fieldError('privacy')}
    <button className="button button-primary" type="submit">Enviar mensaje <span aria-hidden="true">↗</span></button>
    <p className="form-status" role="status" aria-live="polite">{status}</p>
  </form>
}

function CountUp({ end, suffix }: { end: number; suffix: string }) {
  const elementRef = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(end); return }
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 900)
        setValue(Math.round(end * (1 - (1 - progress) ** 3)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(element)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [end])
  return <span ref={elementRef}>{String(value).padStart(2, '0')} {suffix}</span>
}

function GalleryLightbox({ category, initialIndex, onClose }: { category: Category; initialIndex: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [current, setCurrent] = useState(initialIndex)
  const touchStart = useRef<number | null>(null)
  const photo = category.images[current]
  const previous = () => setCurrent((index) => (index - 1 + category.images.length) % category.images.length)
  const next = () => setCurrent((index) => (index + 1) % category.images.length)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  useEffect(() => {
    const nextPhoto = category.images[(current + 1) % category.images.length]
    const preload = new Image()
    preload.src = imagePath(nextPhoto.src)
  }, [category, current])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') { event.preventDefault(); next() }
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [category, current])

  return <dialog className="lightbox" ref={dialogRef} aria-label={`Galería de ${category.title}`} onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === dialogRef.current) onClose() }} onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX }} onTouchEnd={(event) => {
    const start = touchStart.current
    const delta = start === null ? 0 : event.changedTouches[0].clientX - start
    if (Math.abs(delta) > 48) delta < 0 ? next() : previous()
    touchStart.current = null
  }}>
    <div className="lightbox-panel"><div className="lightbox-top"><div><p className="eyebrow">{category.title}</p><span>{String(current + 1).padStart(2, '0')} / {String(category.images.length).padStart(2, '0')}</span></div><button className="lightbox-close" type="button" onClick={onClose} aria-label="Cerrar galería" autoFocus><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
      <div className="lightbox-view"><button className="lightbox-arrow" type="button" onClick={previous} aria-label="Fotografía anterior"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><figure><img src={imagePath(photo.src)} alt={photo.alt} width={photo.width} height={photo.height} /><figcaption>{photo.alt}</figcaption></figure><button className="lightbox-arrow" type="button" onClick={next} aria-label="Fotografía siguiente"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button></div>
      <div className="lightbox-hint">Use las flechas del teclado o deslice para recorrer las fotografías.</div>
    </div>
  </dialog>
}

function HeroSceneGate({ progress }: { progress: MutableRefObject<number> }) {
  const host = useRef<HTMLDivElement>(null)
  const [eligible, setEligible] = useState(false)
  const [requested, setRequested] = useState(false)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const weakDevice = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const slowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g'
    if (!window.matchMedia('(min-width: 1024px)').matches || reducedMotion || weakDevice || connection?.saveData || slowConnection) return
    setEligible(true)
  }, [])
  useEffect(() => {
    if (!requested) return
    const target = host.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(target)
    return () => observer.disconnect()
  }, [requested])
  return <div ref={host} className="hero-scene">
    {eligible && !requested && <button className="scene-trigger" type="button" onClick={() => setRequested(true)}>Activar vista 3D <span aria-hidden="true">↗</span></button>}
    {requested && inView && <div className="hero-canvas-wrap" aria-hidden="true"><Suspense fallback={null}><LazyHeroScene progress={progress} /></Suspense></div>}
  </div>
}

export default function App() {
  const heroPhoto = categories[0].images[0]
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ category: Category; index: number } | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const heroProgress = useRef(0)
  const [scrolled, setScrolled] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const openGallery = (category: Category, index: number, trigger: HTMLElement) => {
    returnFocus.current = trigger
    setLightbox({ category, index })
  }
  const closeGallery = () => {
    setLightbox(null)
    window.requestAnimationFrame(() => returnFocus.current?.focus())
  }
  useEffect(() => {
    const hero = document.getElementById('inicio')
    if (!hero) return
    let frame = 0
    const updateProgress = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(hero.clientHeight, 1)))
        heroProgress.current = progress
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) hero.style.setProperty('--hero-parallax', `${progress * 22}px`)
      })
    }
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    updateProgress()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', updateProgress); window.removeEventListener('resize', updateProgress) }
  }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'))
      return () => window.removeEventListener('scroll', onScroll)
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect() }
  }, [])
  return <div className="site-shell">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-inner">
        <nav id="site-navigation" className={menuOpen ? 'mobile-open' : ''} aria-label="Navegación principal"><a onClick={closeMenu} href="#inicio">Inicio</a><a onClick={closeMenu} href="#nosotros">Nosotros</a><a onClick={closeMenu} href="#servicios">Servicios</a><a onClick={closeMenu} href="#proyectos">Proyectos</a><a onClick={closeMenu} href="#proceso">Proceso</a><a onClick={closeMenu} href="#testimonios">Testimonios</a><a onClick={closeMenu} href="#contacto">Contacto</a></nav>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}><span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">{menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}</svg></button>
        <a className="header-contact" href={whatsappUrl()} target="_blank" rel="noreferrer">Consulta <span aria-hidden="true">↗</span></a>
      </div>
    </header>
    <main id="contenido">
      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <picture className="hero-image"><source type="image/avif" srcSet={imageCandidates(heroPhoto, 'avif')} sizes="100vw" /><source type="image/webp" srcSet={imageCandidates(heroPhoto, 'webp')} sizes="100vw" /><img src={imagePath(heroPhoto.src)} alt="Casa de líneas contemporáneas con fachada de madera y piedra junto al jardín" width={heroPhoto.width} height={heroPhoto.height} decoding="async" fetchPriority="high" /></picture>
        <div className="hero-shade" />
        <HeroSceneGate progress={heroProgress} />
        <div className="hero-mark" aria-hidden="true">ARKITEKTUR</div>
        <div className="container hero-content"><p className="eyebrow">Arquitectura · Interiorismo · Proyectos de inversión</p><h1 id="hero-title">Diseñando espacios.<br /><em>Elevando vidas.</em></h1><p className="hero-tagline">Designing spaces. Elevating lives.</p><p className="hero-owner">{siteConfig.owner} · {siteConfig.role}</p><div className="actions"><a className="button button-primary" href="#proyectos">Ver proyectos <span aria-hidden="true">↗</span></a><a className="button button-outline" href={whatsappUrl()} target="_blank" rel="noreferrer">Consultar <span aria-hidden="true">↗</span></a></div></div>
        <div className="container hero-stats" aria-label="Datos del estudio"><article><span>Áreas de trabajo</span><strong><CountUp end={categories.length} suffix="categorías" /></strong><small>Arquitectura e interiorismo</small></article><article><span>Galería</span><strong><CountUp end={categories.reduce((total, category) => total + category.images.length, 0)} suffix="fotografías" /></strong><small>En cuatro categorías</small></article><article><span>Área atendida</span><strong>México</strong><small>Ubicación exacta por confirmar</small></article></div>
        <a className="scroll-cue" href="#proyectos"><span aria-hidden="true">↓</span><span className="sr-only">Ir a proyectos</span></a>
      </section>

      <section className="about section-pad" id="nosotros" aria-labelledby="about-title"><div className="container about-layout"><div className="about-copy reveal"><p className="eyebrow">El estudio</p><h2 id="about-title">Espacios con sentido. <em>Diseño que permanece.</em></h2><p>{siteConfig.slogan} Interpretamos lo que cada cliente desea para encontrar un estilo propio, con plenitud y satisfacción en cada proyecto.</p><div className="value-list"><article><span className="line-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 16s4-7 12-7 12 7 12 7-4 7-12 7S4 16 4 16Z"/><circle cx="16" cy="16" r="3"/></svg></span><div><h3>Escucha</h3><p>Partimos de cómo vive y qué desea cada cliente.</p></div></article><article><span className="line-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 25 24 7l3 3L9 28H6v-3Z"/><path d="m18 10 4 4M5 5h8M5 9h5"/></svg></span><div><h3>Intención</h3><p>Cada trazo responde a una necesidad real.</p></div></article><article><span className="line-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M5 27V12l11-7 11 7v15H5Z"/><path d="M12 27v-9h8v9M3 27h26"/></svg></span><div><h3>Detalle</h3><p>Materiales, iluminación y vistas pensados en conjunto.</p></div></article></div></div><figure className="about-image reveal"><ResponsiveImage photo={categories[0].images[2]} sizes="(max-width: 760px) 90vw, 48vw" /><figcaption><span>Arquitectura · Interiorismo</span><strong>Desde 20XX</strong><small>Año de fundación por confirmar</small></figcaption></figure></div></section>

      <section className="services section-pad" id="servicios" aria-labelledby="services-title"><div className="container"><div className="section-heading reveal"><p className="eyebrow">Lo que hacemos</p><h2 id="services-title">Diseño para distintas formas de habitar.</h2><p>Arquitectura e interiorismo guiados por la manera en que cada espacio se vive.</p></div><div className="service-grid">{[
        ['Arquitectura residencial', 'Diseño de residencias con detalles que expresan el estilo de cada cliente.'],
        ['Casa habitación', 'Construcciones limpias y sencillas, pensadas para transmitir seguridad y calma.'],
        ['Interiorismo', 'Espacios acogedores con atención a las vistas, los materiales y la iluminación.'],
        ['Proyectos de inversión', 'Desarrollos habitacionales, industriales, comerciales y oficinas.'],
        ['Diseño de espacios', 'Propuestas que relacionan función, luz y carácter en cada ambiente.'],
        ['Acompañamiento de proyecto', 'Del primer bosquejo y modelado 2D/3D hasta la entrega del proyecto.'],
      ].map(([title, description], index) => <article className="service-card reveal" key={title}><span className="line-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d={['M4 26 16 6l12 20H4Z', 'M5 27V12l11-7 11 7v15H5Z', 'M4 8h24v18H4zM10 8v18m12-18v18M4 15h24', 'M5 27V9h22v18H5Zm5-12h4m4 0h4m-12 6h4m4 0h4', 'M4 26 16 6l12 20M9 18h14M12 24h8', 'M6 27V13l10-7 10 7v14M11 27v-8h10v8'].at(index)} /></svg></span><p className="service-index">0{index + 1}</p><h3>{title}</h3><p>{description}</p><a href="#contacto" aria-label={`Consultar sobre ${title}`}><span aria-hidden="true">↗</span></a></article>)}</div></div></section>

      <section className="projects section-pad" id="proyectos" aria-labelledby="projects-title">
        <div className="container"><div className="section-heading reveal"><p className="eyebrow">Obra y espacios</p><h2 id="projects-title">Proyectos</h2><p>Arquitectura pensada para transformar la manera de vivir y habitar cada espacio.</p></div>
          <div className="project-grid">{categories.map((category, index) => <article className={`project-card project-${index + 1} reveal`} key={category.id} id={`galeria-${category.id}`}>
            <button className="project-cover" type="button" onClick={(event) => openGallery(category, 0, event.currentTarget)} aria-label={`Abrir galería de ${category.title}`}><ResponsiveImage photo={category.images[0]} loading={index < 2 ? 'eager' : 'lazy'} sizes="(max-width: 760px) 90vw, 50vw" /><span className="image-count">07 fotografías</span></button>
            <div className="project-copy"><p className="project-index">0{index + 1} / 04</p><h3>{category.title}</h3><p>{category.description}</p><button className="text-link" type="button" onClick={(event) => openGallery(category, 0, event.currentTarget)}>Ver galería <span aria-hidden="true">→</span></button></div>
          </article>)}</div>
        </div>
      </section>

      <section className="featured section-pad" aria-labelledby="featured-title"><div className="container featured-layout"><div className="featured-copy reveal"><p className="eyebrow">Proyecto destacado</p><h2 id="featured-title">{categories[0].title}<br /><em>Arquitectura para vivir.</em></h2><p>{categories[0].description}</p><dl><div><dt>Tipo</dt><dd>Residencial</dd></div><div><dt>Ubicación</dt><dd>Por confirmar</dd></div><div><dt>Área</dt><dd>Por confirmar</dd></div></dl><a className="text-link" href="#galeria-residencias">Explorar proyecto <span aria-hidden="true">↗</span></a></div><div className="featured-image reveal"><ResponsiveImage photo={categories[0].images[1]} sizes="(max-width: 760px) 90vw, 56vw" /></div></div></section>

      <section className="process section-pad" id="proceso" aria-labelledby="process-title"><div className="container"><div className="section-heading reveal"><p className="eyebrow">Del primer trazo a la entrega</p><h2 id="process-title">Un proceso claro, de principio a fin.</h2></div><ol className="process-grid">
        <li><span>01</span><h3>Escuchar</h3><p>Entendemos cómo vive o trabaja el cliente y qué desea.</p></li>
        <li><span>02</span><h3>Diseñar</h3><p>Del bosquejo al modelado 2D y 3D, con revisiones.</p></li>
        <li><span>03</span><h3>Detallar</h3><p>Materiales, vistas e iluminación pensados para cada espacio.</p></li>
        <li><span>04</span><h3>Entregar</h3><p>Acompañamos hasta que el resultado coincida con lo imaginado.</p></li>
      </ol></div></section>

      <section className="testimonials section-pad" id="testimonios" aria-labelledby="testimonials-title"><div className="container testimonial-card reveal"><div><p className="eyebrow">Testimonios</p><h2 id="testimonials-title">La experiencia de nuestros clientes.</h2></div><blockquote><span aria-hidden="true">“</span><p>El testimonio de un cliente se añadirá aquí cuando el texto y su autorización estén confirmados.</p><footer>Testimonio pendiente de aprobación</footer></blockquote></div></section>

      <section className="contact section-pad" id="contacto" aria-labelledby="contact-title"><div className="container"><div className="section-heading reveal"><p className="eyebrow">Cuéntenos su idea</p><h2 id="contact-title">Creemos algo extraordinario juntos.</h2><p>Estamos listos para escuchar y dar forma a su próximo espacio.</p></div><div className="contact-layout reveal"><ContactForm /><aside className="contact-details"><p className="eyebrow">Contacto directo</p><ul>
        <li><span>Teléfono</span><a href={`tel:${siteConfig.phoneLink}`}>{siteConfig.phone}</a></li><li><span>Alternativa</span><a href={`tel:${siteConfig.alternatePhoneLink}`}>{siteConfig.alternatePhone}</a></li><li><span>Correo electrónico</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li><li><span>Ubicación</span><span>{siteConfig.location || 'Por confirmar'}</span></li>
      </ul>{siteConfig.location && <p className="contact-location">{siteConfig.location}</p>}<a className="button button-outline" href={whatsappUrl()} target="_blank" rel="noreferrer">Reservar consulta <span aria-hidden="true">↗</span></a><p className="whatsapp-alt">También puede escribir al <a href={whatsappUrl('525513924989')} target="_blank" rel="noreferrer">WhatsApp alternativo</a>.</p>{(siteConfig.instagram || siteConfig.facebook) && <ul className="social-links">{siteConfig.instagram && <li><a href={siteConfig.instagram}>Instagram</a></li>}{siteConfig.facebook && <li><a href={siteConfig.facebook}>Facebook</a></li>}</ul>}</aside></div></div></section>
    </main>
    <footer className="site-footer"><div className="container footer-top"><div className="footer-brand"><p className="footer-word">Arkitektur Studio</p><p>{siteConfig.slogan}</p></div><div className="footer-owner"><p className="owner-name">EDGAR ISRAEL <strong>SÁNCHEZ MORENO</strong></p><p className="owner-role">arquitecto – decorador</p><nav aria-label="Enlaces de pie de página"><a href="#proyectos">Proyectos</a><a href="#proceso">Proceso</a><a href="#estudio">Estudio</a><a href="#contacto">Contacto</a></nav></div><p className="legal">Todo el material, ideas, conceptos, prototipos, proyectos y soluciones presentados en este sitio son propiedad del diseñador y/o autor, quien se reserva todos los derechos. Queda prohibida su reproducción parcial o total sin autorización previa por escrito.</p></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Arkitektur Studio. Todos los derechos reservados.</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></div></footer>
    {lightbox && <GalleryLightbox category={lightbox.category} initialIndex={lightbox.index} onClose={closeGallery} />}
  </div>
}
