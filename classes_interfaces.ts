export class ListingInfo {
  link: String;
  title: String;
  isRelisted: boolean;
  // listing options: On default - all of them are intialized to false
  showCaseListing: boolean = false;
  featuredListing: boolean = false;
  sponsoredListing: boolean = false;
  hightLight: boolean = false;
  boldfaceTitle: boolean = false;
  coloredTitle: boolean = false;
  coloredTitleColor: String = "Red"; // Can be: "Red" / "Green" / "Blue"
  viewCounter: boolean = false;
  thumbnailImage: boolean = true;
  allow_Subtitle: boolean = false;
  subtitle: String = "";
  isNew: boolean; // found a new unlisted listing?
  wantRelist: boolean = false;

  constructor (link: String, isRelisted: boolean, title: String, isNew = true){
    this.link = link;
    this.isRelisted = isRelisted;
    this.isNew = isNew;
    this.title = title;
  }
}

enum ColorEnum {
  Red,
  Green,
  Blue
}