'use client';

import { clsx } from 'clsx/lite';
import { Design, DESIGN_CONFIG, DESIGNS } from '.';
import { updateDesignAction } from './actions';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';

export default function AdminDesignClient({
  currentDesign,
}: {
  currentDesign: Design
}) {
  return (
    <form action={updateDesignAction} className="max-w-xl space-y-6">
      <div className="space-y-2">
        {DESIGNS.map(design => {
          const { title, description, swatches } = DESIGN_CONFIG[design];
          return (
            <label
              key={design}
              className={clsx(
                'flex items-center gap-3',
                'p-3 border-medium border cursor-pointer',
                'component-surface',
                'font-normal normal-case tracking-normal text-main',
              )}
            >
              <input
                type="radio"
                name="design"
                value={design}
                defaultChecked={design === currentDesign}
              />
              <span className="grow">
                <span className="block font-medium">
                  {title}
                  {design === currentDesign &&
                    <span className="text-dim font-normal"> — current</span>}
                </span>
                <span className="block text-medium text-sm">
                  {description}
                </span>
              </span>
              <span className="flex gap-1 shrink-0">
                {swatches.map(color =>
                  <span
                    key={color}
                    className="size-4 border-medium border"
                    style={{ backgroundColor: color }}
                  />)}
              </span>
            </label>
          );
        })}
      </div>
      <SubmitButtonWithStatus
        onFormSubmitToastMessage="Design applied for all visitors"
      >
        Apply design
      </SubmitButtonWithStatus>
    </form>
  );
}
