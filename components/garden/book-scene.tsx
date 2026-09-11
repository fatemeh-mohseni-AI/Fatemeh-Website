"use client";
import { Component, lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Dialog as Primitive } from "radix-ui";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Dialog, DialogPortal, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { books } from "@/lib/garden/books";
import { tableAnchor } from "@/lib/garden/book-geometry";
import type { MeshState } from "./book-mesh";
const BookMesh = lazy(()=>import("./book-mesh"));
const clamp=(x:number)=>Math.max(0,Math.min(1,x));

// A failed graphics chunk must never take down the Library or its navigation.
class GraphicsBoundary extends Component<{children:ReactNode; onFailure:()=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onFailure();}
  render(){return this.state.failed?null:this.props.children;}
}

export function BookScene({ reduced, onDiscover }: { reduced: boolean; onDiscover: ()=>void }) {
  const [open,setOpen]=useState(false);
  const [ready,setReady]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  const [reading,setReading]=useState(false);
  const [mesh,setMesh]=useState<MeshState>({index:0,direction:1,progress:0,turning:false,opening:0});
  const state=useRef(mesh);
  const frame=useRef(0);
  const locked=useRef(false);
  const surface=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const drag=useRef<{id:number;x:number;direction:-1|1;width:number}|null>(null);
  const [anchor,setAnchor]=useState({x:0,y:0,scale:1});
  const [origin,setOrigin]=useState({x:0,y:0});
  const update=(next:MeshState)=>{state.current=next;setMesh(next);};
  useEffect(()=>{
    const place=()=>{
      const mobile=window.matchMedia("(max-width: 600px)").matches;
      const element=mobile?surface.current:document.querySelector(".library-backdrop");
      if(!element) return;
      const rect=element.getBoundingClientRect();
      setAnchor(tableAnchor(rect.width,rect.height,mobile?.5:.75));
    };
    const observer=new ResizeObserver(place);
    if(surface.current) observer.observe(surface.current);
    const backdrop=document.querySelector(".library-backdrop"); if(backdrop) observer.observe(backdrop);
    window.addEventListener("resize",place);place();
    return ()=>{observer.disconnect();window.removeEventListener("resize",place);cancelAnimationFrame(frame.current);};
  },[]);
  const animate=(from:number,to:number,duration:number,step:(p:number)=>void,done:()=>void)=>{
    cancelAnimationFrame(frame.current);
    if(reduced || unavailable){step(to);done();return;}
    const start=performance.now();
    const tick=(now:number)=>{
      const t=clamp((now-start)/duration),ease=t*t*(3-2*t);
      step(from+(to-from)*ease);
      if(t<1) frame.current=requestAnimationFrame(tick); else done();
    };
    frame.current=requestAnimationFrame(tick);
  };
  const show=()=>{
    if(locked.current) return;
    const rect=trigger.current!.getBoundingClientRect();
    setOrigin({x:rect.left+rect.width/2-window.innerWidth/2,y:rect.top+rect.height/2-window.innerHeight/2});
    locked.current=true;setReady(false);setOpen(true);setReading(false);onDiscover();
    update({...state.current,turning:false,opening:reduced?1:0});
  };
  const startOpening=()=>animate(0,1,1500,p=>update({...state.current,opening:clamp((p-.2)/.8)}),()=>{locked.current=false;setReady(true);});
  const graphicsUnavailable=()=>{
    cancelAnimationFrame(frame.current);locked.current=false;
    setUnavailable(true);setReading(true);setReady(true);
    update({...state.current,opening:1,turning:false});
  };
  const close=()=>{
    cancelAnimationFrame(frame.current);drag.current=null;locked.current=false;
    update({...state.current,turning:false,progress:0,opening:0});
    setOpen(false);setReady(false);
  };
  const canTurn=(direction:-1|1)=>ready&&!locked.current&&state.current.index+direction>=0&&state.current.index+direction<books.length;
  const settle=(complete:boolean)=>{
    if(!state.current.turning)return;
    locked.current=true;drag.current=null;
    const turn=state.current;
    animate(turn.progress,complete?1:0,480,p=>update({...turn,progress:p}),()=>{
      update({...turn,index:turn.index+(complete?turn.direction:0),progress:0,turning:false});locked.current=false;
    });
  };
  const turn=(direction:-1|1)=>{
    if(!canTurn(direction))return;
    update({...state.current,turning:true,direction,progress:0});settle(true);
  };
  const pointerDown=(event:PointerEvent<HTMLDivElement>)=>{
    if(event.button!==0||!event.isPrimary)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width, y=(event.clientY-rect.top)/rect.height;
    if(y<.65 || (x>.2&&x<.8))return;
    const direction=x>.5?1:-1;
    if(!canTurn(direction))return;
    event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
    locked.current=true;
    drag.current={id:event.pointerId,x:event.clientX,direction,width:rect.width};
    update({...state.current,turning:true,direction,progress:0});
  };
  const pointerMove=(event:PointerEvent<HTMLDivElement>)=>{
    const d=drag.current;if(!d||d.id!==event.pointerId)return;
    update({...state.current,progress:clamp((d.x-event.clientX)*d.direction/(d.width*.48))});
  };
  const pointerEnd=(event:PointerEvent<HTMLDivElement>,cancel=false)=>{
    if(drag.current?.id!==event.pointerId)return;
    settle(!cancel&&state.current.progress>.25);
  };
  const book=books[mesh.index];
  const vars={"--table-x":anchor.x+"px", "--table-y":anchor.y+"px","--table-scale":anchor.scale} as CSSProperties;
  return <Dialog open={open} onOpenChange={value=>value?show():close()}>
    <div className="book-table-surface" ref={surface} style={vars}>
      <DialogTrigger asChild>
        <button ref={trigger} className="table-book" aria-label="Open the library book collection">
          <span className="table-book-cover"><img src={books[0].coverImage} alt={books[0].coverAlt} draggable={false}/></span>
          <span className="table-book-hint">A book is waiting</span>
        </button>
      </DialogTrigger>
    </div>
    <DialogPortal>
      <Primitive.Overlay className="library-book-overlay"/>
      <Primitive.Content className="library-book-dialog" data-reduced={reduced||undefined}
        onKeyDown={event=>{
          if(event.key==="ArrowLeft"||event.key==="ArrowRight") {event.preventDefault();turn(event.key==="ArrowRight"?1:-1);}
        }}>
        <DialogTitle className="sr-only">The Library book collection</DialogTitle>
        <DialogDescription className="sr-only">Drag the lower page corners or use the arrow keys. Every spread introduces a different book.</DialogDescription>
        <header className="library-book-header">
          <span>THE LIBRARY · PERSONAL SHELF</span>
          <button onClick={close}><span>Back to Library</span><X size={20}/></button>
        </header>
        <div className="library-book-body">
          <div className="library-book-stage" data-unavailable={unavailable||undefined}
            style={{"--origin-x":origin.x+"px","--origin-y":origin.y+"px"} as CSSProperties}
            onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event=>pointerEnd(event)}
            onPointerCancel={event=>pointerEnd(event,true)} onLostPointerCapture={event=>pointerEnd(event,true)}>
            <GraphicsBoundary onFailure={graphicsUnavailable}>
              <Suspense fallback={<p className="book-loading" role="status">Opening the book…</p>}>
                <BookMesh state={mesh} onReady={startOpening} onUnavailable={graphicsUnavailable}/>
              </Suspense>
            </GraphicsBoundary>
            {unavailable&&<p className="book-loading">3D is unavailable on this device. The reading view remains available below.</p>}
          </div>
          <section className="library-book-reading" hidden={!reading&&!unavailable} aria-label="Readable book details">
            <img src={book.coverImage} alt={book.coverAlt}/>
            <div><h2>{book.title}</h2><p>{book.author}</p><p>{book.description}</p>
              {book.quotes.map(q=><blockquote key={q}>“{q}”</blockquote>)}
              {book.personalNote&&<p><small>Reading note · draft</small><br/>{book.personalNote}</p>}
            </div>
          </section>
        </div>
        <footer className="library-book-controls">
          <button aria-label="Previous book" disabled={!ready||mesh.turning||mesh.index===0} onClick={()=>turn(-1)}><ArrowLeft/></button>
          <div role="status" aria-live="polite"><span>{mesh.index+1} / {books.length} books · {book.title}</span><small>Drag a lower page corner to turn</small></div>
          <button aria-label="Next book" disabled={!ready||mesh.turning||mesh.index===books.length-1} onClick={()=>turn(1)}><ArrowRight/></button>
          <button className="book-reading-toggle" aria-expanded={reading} onClick={()=>setReading(v=>!v)}>Reading view</button>
        </footer>
      </Primitive.Content>
    </DialogPortal>
  </Dialog>;
}
