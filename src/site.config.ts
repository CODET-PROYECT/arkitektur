export const siteConfig = {
  name: 'Arkitektur Studio',
  owner: 'Edgar Israel Sánchez Moreno',
  role: 'arquitecto – decorador',
  slogan: 'Logrando cambios de vida por medio de arquitectura e interiorismo.',
  phone: '+52 442 149 5951',
  phoneLink: '+524421495951',
  alternatePhone: '+52 55 1392 4989',
  alternatePhoneLink: '+525513924989',
  email: 'peiarq@gmail.com',
  whatsapp: '524421495951',
  whatsappMessage: 'Hola, me gustaría recibir información sobre sus servicios.',
  formAction: '', // TODO: configurar endpoint de Formspree, Netlify Forms o propio.
  location: '', // TODO: confirmar ubicación antes de publicar.
  instagram: '', // TODO: añadir red social confirmada por el cliente.
  facebook: '', // TODO: añadir red social confirmada por el cliente.
  portrait: null as { src: string; alt: string; width: number; height: number } | null, // TODO: solicitar retrato de Edgar.
  privacyNoticeUrl: '', // TODO: agregar aviso de privacidad aprobado por el cliente.
  projectNames: {}, // TODO: añadir nombres de obra confirmados en gallery.json.
  siteUrl: 'https://codet-proyect.github.io/arkitektur/',
}

export const whatsappUrl = (number = siteConfig.whatsapp) =>
  `https://wa.me/${number}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`
