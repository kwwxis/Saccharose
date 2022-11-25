// character
// name -> _s,_t

// title -> _s,_t
// subtitle
// file -> _male,_female
// language -> _s,_t
// tx -> _s,_t
// rm -> _s,_t
//

export interface VoiceOverDto {
  character: string;
  language: string;
  name: string;

  components: DtoComponent[];
}

export interface DtoComponent {}

export interface DtoComment extends DtoComponent {
  comment: string;
}
export interface DtoProperty extends DtoComponent {
  value: string|number;
}
export interface DtoGroup extends DtoComponent {
  groupName: string;
  components: DtoComponent[];
}