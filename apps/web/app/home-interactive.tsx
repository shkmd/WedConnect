'use client';

import { useMemo, useState } from 'react';

const styles = [
  { name: 'Timeless', icon: '♕', copy: 'Classic details, rich florals and graceful portraits.', category: 'photography' },
  { name: 'Modern', icon: '◇', copy: 'Clean lines, editorial frames and understated elegance.', category: 'venues' },
  { name: 'Garden', icon: '❀', copy: 'Soft colour, natural textures and an open-air celebration.', category: 'decor' },
  { name: 'Cultural', icon: '✦', copy: 'Meaningful rituals, vibrant details and family traditions.', category: 'photography' },
] as const;

const stories = [
  { quote: 'We found a photographer whose work felt intimate and completely us.', names: 'Ananya & Vikram', detail: 'Coimbatore · Photography', image: '/images/home/photography.webp' },
  { quote: 'Our venue shortlist came together in one evening, without endless calls.', names: 'Meera & Arjun', detail: 'Chennai · Wedding venue', image: '/images/home/venue.webp' },
  { quote: 'The privacy-first enquiry made comparing teams feel calm and considered.', names: 'Nila & Karthik', detail: 'Madurai · Wedding planning', image: '/images/home/decor.webp' },
] as const;

const featured = [
  { name:'Velvet Frame Studio', category:'Wedding photography', city:'Coimbatore', image:'/images/home/photography.webp', price:'₹45,000', rating:'4.9', response:'Usually replies in 2 hours', tags:['Candid stories','Wedding films'] },
  { name:'The Ivory Courtyard', category:'Wedding venue', city:'Coimbatore', image:'/images/home/venue.webp', price:'₹1,25,000', rating:'4.8', response:'Usually replies today', tags:['Indoor & outdoor','Up to 500 guests'] },
  { name:'Aara Bridal Artistry', category:'Bridal makeup', city:'Chennai', image:'/images/home/makeup.webp', price:'₹18,000', rating:'4.9', response:'Usually replies in 1 hour', tags:['HD bridal look','Draping included'] },
  { name:'Marigold Table', category:'Wedding catering', city:'Coimbatore', image:'/images/home/catering.webp', price:'₹850 / plate', rating:'4.7', response:'Usually replies today', tags:['Custom menus','Tasting available'] },
] as const;

export default function HomeInteractive() {
  const [style, setStyle] = useState(0);
  const [guests, setGuests] = useState(250);
  const [story, setStory] = useState(0);
  const [featuredStart, setFeaturedStart] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const estimate = useMemo<[number, number]>(() => {
    const low = Math.round((guests * 2100 + 280000) / 50000) * 50000;
    return [low, Math.round((low * 1.55) / 50000) * 50000];
  }, [guests]);
  const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const currentStyle = styles[style] ?? styles[0];
  const currentStory = stories[story] ?? stories[0];
  const orderedFeatured = featured.map((_, offset) => featured[(featuredStart + offset) % featured.length]!);

  return <>
    <section className="featured-section" aria-labelledby="featured-title">
      <div className="featured-heading"><div><p className="market-kicker">Handpicked for your search</p><h2 id="featured-title">Featured professionals</h2><p>Explore complete profiles with clear services, indicative pricing and response expectations.</p></div><div className="featured-controls"><button type="button" aria-label="Previous professionals" onClick={()=>setFeaturedStart((featuredStart+featured.length-1)%featured.length)}>←</button><button type="button" aria-label="Next professionals" onClick={()=>setFeaturedStart((featuredStart+1)%featured.length)}>→</button><a href="/coimbatore/photography">View all →</a></div></div>
      <div className="featured-grid">{orderedFeatured.map((vendor)=><article className="featured-card" key={vendor.name}><div className="featured-photo"><img src={vendor.image} alt={`${vendor.name} portfolio`}/><span className="featured-badge">◇ Complete profile</span><button type="button" className={saved.includes(vendor.name)?'saved':''} aria-label={`Save ${vendor.name}`} onClick={()=>setSaved(saved.includes(vendor.name)?saved.filter(name=>name!==vendor.name):[...saved,vendor.name])}>{saved.includes(vendor.name)?'♥':'♡'}</button><span className="featured-rating">★ {vendor.rating}</span></div><div className="featured-card-copy"><div className="featured-title"><div><h3>{vendor.name}</h3><span>{vendor.category}</span></div><button type="button" className={compare.includes(vendor.name)?'selected':''} onClick={()=>setCompare(compare.includes(vendor.name)?compare.filter(name=>name!==vendor.name):compare.length<3?[...compare,vendor.name]:compare)}>⇄ {compare.includes(vendor.name)?'Added':'Compare'}</button></div><p className="featured-location">⌖ {vendor.city} <span>·</span> ◷ {vendor.response}</p><div className="featured-price"><small>Starting from</small><strong>{vendor.price}</strong></div><div className="featured-tags">{vendor.tags.map(tag=><span key={tag}>{tag}</span>)}</div><footer><a href="/requirements/new">Request a quote →</a><a href="/coimbatore/photography">View profile</a></footer></div></article>)}</div>
      <div className="featured-trust"><span>✓ Profile completeness shown</span><span>◇ Pricing is indicative</span><span>♡ Free to enquire</span><span>◷ Response time is transparent</span></div>
      {compare.length>0&&<div className="compare-dock"><span><strong>{compare.length}</strong> selected to compare</span><button type="button" onClick={()=>setCompare([])}>Clear</button><a href="/shortlists">Compare profiles →</a></div>}
    </section>
    <section className="style-finder" aria-labelledby="style-title">
      <div className="interactive-heading"><p className="market-kicker">Discover your celebration</p><h2 id="style-title">What feels most like you?</h2><p>Choose a direction and we’ll take you to professionals who can bring it to life.</p></div>
      <div className="style-options" role="list">{styles.map((item, index) => <button className={index === style ? 'selected' : ''} type="button" onClick={() => setStyle(index)} key={item.name}><span>{item.icon}</span><strong>{item.name}</strong><small>{item.copy}</small></button>)}</div>
      <div className="style-result"><div><small>Your wedding direction</small><strong>{currentStyle.name}, personal and beautifully considered.</strong></div><a href={`/coimbatore/${currentStyle.category}`}>Explore matching professionals <span>→</span></a></div>
    </section>

    <section className="budget-studio" aria-labelledby="budget-title">
      <div className="budget-copy"><p className="market-kicker">Plan with confidence</p><h2 id="budget-title">A thoughtful starting point for your budget</h2><p>Move the guest count to see an indicative full-wedding range. Your final plan remains entirely yours.</p><div className="budget-note">An editorial estimate, not a vendor quotation.</div></div>
      <div className="budget-card"><div className="guest-total"><span>Estimated guests</span><strong>{guests}</strong></div><input aria-label="Estimated guest count" type="range" min="50" max="1000" step="25" value={guests} onChange={(event) => setGuests(Number(event.target.value))}/><div className="range-labels"><span>50</span><span>1,000</span></div><div className="estimate"><small>Indicative celebration range</small><strong>{money(estimate[0])} — {money(estimate[1])}</strong><p>Includes an indicative venue, food, decor, photography and beauty allocation.</p></div><a href="/requirements/new">Create a personalised requirement →</a></div>
    </section>

    <section className="couple-stories" aria-labelledby="stories-title">
      <div className="story-image"><img src={currentStory.image} alt="Wedding celebration"/></div>
      <div className="story-copy"><p className="market-kicker">Notes from our couples</p><h2 id="stories-title">“{currentStory.quote}”</h2><strong>{currentStory.names}</strong><span>{currentStory.detail}</span><div className="story-controls"><button type="button" aria-label="Previous story" onClick={() => setStory((story + stories.length - 1) % stories.length)}>←</button><div>{stories.map((item,index) => <button type="button" aria-label={`Show story from ${item.names}`} className={index === story ? 'active' : ''} onClick={() => setStory(index)} key={item.names}/>)}</div><button type="button" aria-label="Next story" onClick={() => setStory((story + 1) % stories.length)}>→</button></div></div>
    </section>
  </>;
}
