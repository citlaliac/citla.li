import React, { useState } from 'react';

import { CEC_LOCATIONS } from './cecConfig';

import { hasAmenDiscovery } from './cecConfig';



const PUB = process.env.PUBLIC_URL || '';

const RELICS_BASE = `${PUB}/assets/catholicecloud/relics`;

const MAP_IMAGE = `${PUB}/assets/catholicecloud/map2.png`;



function CecBuilding({ location, worshiper, onSelect }) {

  const [useFallback, setUseFallback] = useState(false);

  const visited =

    location.actionId && worshiper.completedActions.includes(location.actionId);

  const discovered = hasAmenDiscovery(worshiper, location.id);

  const src = location.buildingFile

    ? `${RELICS_BASE}/${location.buildingFile}`

    : null;



  return (

    <div

      className={`cec-building cec-building--${location.id}${
        visited || discovered ? ' cec-building--visited' : ''
      }`}

      style={{ top: location.top, left: location.left }}

    >

      <button

        type="button"

        className="cec-building-hit"

        onClick={() => onSelect(location)}

        aria-label={`${location.label}. Click to visit.`}

      >

        {src && !useFallback ? (

          <img

            className="cec-building-img"

            src={src}

            alt=""

            draggable={false}

            onError={() => setUseFallback(true)}

          />

        ) : (

          <span className="cec-building-emoji" aria-hidden>

            {location.fallbackEmoji}

          </span>

        )}

      </button>

      <span className="cec-building-label">

        {location.label}

      </span>

    </div>

  );

}



function CecParishMap({ worshiper, onSelectLocation }) {

  return (

    <div className="cec-playfield cec-playfield--map">

      <div className="cec-map-frame">

        <img className="cec-map-base" src={MAP_IMAGE} alt="" draggable={false} />

        <div className="cec-map-stops" role="group" aria-label="Parish map stops">

          {CEC_LOCATIONS.map((loc) => (

            <CecBuilding

              key={loc.id}

              location={loc}

              worshiper={worshiper}

              onSelect={onSelectLocation}

            />

          ))}

        </div>

      </div>

    </div>

  );

}



export default CecParishMap;


