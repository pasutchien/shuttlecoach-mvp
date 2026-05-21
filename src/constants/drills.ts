/**
 * Drill library (SPEC §10). Every Mistake Card references one drill by id; the
 * S10 "How To Fix" sheet renders it.
 *
 * Drill text is treated as analysis *content* (what a real CV/AI backend would
 * return), not UI chrome — so it is fixture data here rather than i18n keys.
 */
import type { Drill } from '@/src/types';

export const DRILLS: Drill[] = [
  {
    id: 'drill-contact-point',
    name: 'High Contact Reach',
    steps: [
      'Stand side-on to a wall with your racket arm fully extended overhead.',
      'Mark the highest point your strings can reach — that is your contact zone.',
      'Shadow-swing 10 times, making contact at that marked height every rep.',
      'Add a shuttle feed and hit 20 shots, focusing only on contacting high.',
    ],
    coachTip:
      'Reach up to the shuttle instead of letting it drop into your swing — height is power.',
    relatedVideoTitle: 'High Contact Reach — full demonstration',
  },
  {
    id: 'drill-backswing',
    name: 'Full Backswing Loop',
    steps: [
      'Hold the racket relaxed and trace a full circular loop behind your head.',
      'Pause at the deepest point so the racket head points down your back.',
      'From that loaded position, accelerate into a smooth forward swing.',
      'Repeat 15 slow reps, then 15 at match speed.',
    ],
    coachTip:
      'A deep backswing stores energy. Cutting it short is the most common power leak.',
    relatedVideoTitle: 'Full Backswing Loop — full demonstration',
  },
  {
    id: 'drill-weight-transfer',
    name: 'Back-to-Front Step',
    steps: [
      'Start with your weight on your back foot, racket loaded.',
      'As you swing, drive off the back foot and land on the front foot.',
      'Freeze the finish position for two seconds to check your balance.',
      'Do 20 reps, exaggerating the weight shift each time.',
    ],
    coachTip:
      'Power comes from the ground up — your legs start the shot, not your arm.',
    relatedVideoTitle: 'Back-to-Front Step — full demonstration',
  },
  {
    id: 'drill-elbow-lead',
    name: 'Elbow-First Drill',
    steps: [
      'Begin the forward swing by leading with your elbow, racket trailing.',
      'Keep the elbow high — at or above shoulder height for overhead shots.',
      'Let the forearm and wrist snap through only at the last moment.',
      'Shadow 15 reps, then apply to 20 fed shuttles.',
    ],
    coachTip:
      'Think "elbow, then hand". Leading with the racket robs you of whip and control.',
    relatedVideoTitle: 'Elbow-First Drill — full demonstration',
  },
  {
    id: 'drill-grip',
    name: 'Relax & Squeeze Grip',
    steps: [
      'Hold the racket loosely enough that someone could twist it in your hand.',
      'Keep that relaxed grip throughout the backswing.',
      'Squeeze firmly only at the instant of contact, then relax again.',
      'Practise the relax–squeeze–relax cycle on 25 shots.',
    ],
    coachTip:
      'A tight grip slows your swing. Stay loose and let the racket do the work.',
    relatedVideoTitle: 'Relax & Squeeze Grip — full demonstration',
  },
  {
    id: 'drill-follow-through',
    name: 'Complete the Swing',
    steps: [
      'After contact, let the racket travel fully across your body.',
      'Finish with the racket head pointing toward your non-racket hip.',
      'Hold the finished position to confirm you did not cut the swing short.',
      'Hit 20 shots, checking the finish every time.',
    ],
    coachTip:
      'Never brake your swing at contact — a full follow-through means full power and accuracy.',
    relatedVideoTitle: 'Complete the Swing — full demonstration',
  },
  {
    id: 'drill-stance',
    name: 'Shoulder Rotation Drill',
    steps: [
      'Set up side-on with your non-racket shoulder pointing at the net.',
      'Coil by rotating your hips and shoulders away during the backswing.',
      'Uncoil explosively, rotating the racket shoulder through to the front.',
      'Do 15 slow coil-and-uncoil reps, then 15 with a shuttle.',
    ],
    coachTip:
      'Your shoulders are a spring. Rotate fully to unlock effortless power.',
    relatedVideoTitle: 'Shoulder Rotation Drill — full demonstration',
  },
  // Reserved: footwork is not one of the 7 scored checkpoints, so no mistake
  // card references this drill yet. Kept for a future footwork tips section.
  {
    id: 'drill-footwork',
    name: 'Split-Step Timing',
    steps: [
      'As your opponent strikes the shuttle, perform a small split-step hop.',
      'Land balanced on the balls of both feet, ready to push off.',
      'Move to the shuttle in as few steps as possible, then recover to base.',
      'Repeat for 2 minutes, keeping the split-step timing consistent.',
    ],
    coachTip:
      'The split-step is the secret to fast reactions — time it to your opponent’s hit.',
    relatedVideoTitle: 'Split-Step Timing — full demonstration',
  },
];

export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}
