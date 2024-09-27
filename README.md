동시성 제어 방식에 대한 분석 및 보고서

* 동시성 제어를 하지 않았을 경우
 1. 모든 요청이 동시에 요청되어 요청된 사항이 모두 처리되나 반영되지 않고 제일 후순위로 들어온 요청만 반영됨(테스트 결과)
 2. 예를들어 이번 과제에서 id:1의 유저가 200, 300, 400원을 충전하는 요청을 동시에 하였을 경우 제일 후순위로 들어오는 400원만 충전됨
 3. ues의 경우에도 1000의 point를 가진 id:1의 유저가 200point를 사용하는 요청을 30번 요청한 경우 5번의 요청으로 마무리 되는 것이 아닌 30번의 요청이 모두 처리됨
 4. 따라서 이 프로젝트에서의 동시성은 database의 테이블 값의 원자성을 보장하기 위해 필요함.
 5. 4번의 이유 때문에 point와 history 메서드에는 동시성 제어를 하지 않음.
   (- 추가적으로 DBMS를 사용할 경우 동시성이 확보가 되는데 이걸 왜 하라고 하신걸까? 라는 의문이 듬. 하지만 재미있었죠?)

* 동시에 요청이 들어오나 실제 처리하는데 있어 선순위와 후순위가 존재할 것이기 때문에 동시성을 제어하기 위해 필요한 조건
 1. 현재 진행중인 프로세스가 있을 시 그 다음 순위로 요청되는 프로세스의 경우 대기의 상태를 가질것.
 2. 바로 앞 순위의 일이 처리 되고 난 후 동시적으로 후순위 프로세스의 대기상태가 해제되고 프로세스 처리 상태에 들어갈 것
 3. 들어온 순번대로의 순서가 보장될 것

* 작성된 코드

        
        class Mutex {
        	private mutex = Promise.resolve();
        	async lock(): Promise<() => void> {
        		let unlock: () => void;
        		const willLock = new Promise<void>(resolve => unlock = resolve);
        		const previousLock = this.mutex;
        		this.mutex = this.mutex.then(() => willLock);
        		await previousLock;
        		return unlock!;
        	}
        }

        @Injectable()
        export class PointService {
        private readonly userMutexes: Map<number, Mutex> = new Map();
        	constructor(
        		private readonly pointRepository: PointRepositoryImpl
        	) {}
        	private getUserMutex(id: number): Mutex {
        		if (!this.userMutexes.has(id)) {
        		  this.userMutexes.set(id, new Mutex());
        		}
        		return this.userMutexes.get(id) as Mutex;
        	}

        	async charge(id: number, amount: number): Promise<UserPoint> {
        		this.isValidNum(id, 'id');
        		this.isValidNum(amount, 'amount');
        		this.isOver10000(amount);
        		const mutex = this.getUserMutex(id);
        		const unlock = await mutex.lock(); // 동시성 제어 시작
        		try {
        			const changePoint:ChangePoint = new ChangePoint();
        			changePoint.amount = amount;
        			changePoint.point = (await this.pointRepository.point(id)).point + amount;
        			changePoint.id = id;
        			return await this.pointRepository.charge(changePoint);
        		} finally {
        			unlock(); // 작업이 끝나면 뮤텍스 해제
        		}
        	}
        }

* 해설
 1. PoinService의 charge메서드가 pointRepository의 charge함수를 호출하기 이전에
    getUserMutex함수를 호출하여 현재의 id 값이 있음을 확인 후 없을 경우 id와 해당 id의 동시성을 제어하는 Matrix객체를 담는 Map 생성
 2. Mutex에 있는 lock 함수를 호출하여 현재 상태를 대기 상태로 변경
 3. 후 순위에 요청될 함수를 담는 변수 will 생성( 처리가 끝날 경우 후순위의 lock을 해제하는 unlock함수 반환)
 4. 이 전의 함수가 처리되었는 지 알 수 있는 previousLock에 현재의 상태를 주입
 5. 현재의 함수는 끝날 경우 다음 순번의 함수를 불러옴
 6. 현재의 함수가 완료될 때 까지 대기
 7. 현재의 함수가 완료될 경우 다음 순번의 함수 호출

* 의견
 1. 현재의 소스의 경우 charge와 use가 같은 Mutex를 공유하고 있기 때문에 charge 와 use 함수가 동시에 호출될 경우
    id내부의 순서는 보장이 되나 어떤 id의 요청이 먼저 처리가 될 지는 미지수 ( setTimeout과 연관이 있을것이라 추측되나 정확한 테스트를 실행해보지는 못함)
 2. List 에 순서대로 메서드를 실행시키는 함수를 담아 저장하여 하나씩 꺼내쓰는 방식이 아닌 각각의 함수에 본인 앞 뒤의 순번을 가져 순차적으로 진행되는 방식(1순위는 2순위의 존재를 2순위가 요청될 따까지 알 수 없으나 1순위가 완료되었더라도 바로 2순위가 실행될 수 있음 private mutex가 완료된 함수로 선언 및 초기화 된 이유)
